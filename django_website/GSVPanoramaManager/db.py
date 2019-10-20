from neo4j import GraphDatabase

from GSVPanoramaManager import settings
from GSVPanoramaCollector import wssender 

import threading
import json

class DBManager(object):
    
    def __init__(self):
        db_settings = settings.NEO4J_DATABASES['default']

        uri = 'bolt://' + db_settings['HOST'] + ':' + db_settings['PORT']
        auth = (db_settings['USER'], db_settings['PASSWORD'])
        
        self._driver = GraphDatabase.driver(uri, auth=auth)
        with self._driver.session() as session:
            session.run("CREATE CONSTRAINT ON (p:Panorama) ASSERT p.pano IS UNIQUE")

    def close(self):
        self._driver.close()

    def retrieve_ref_panoramas(self):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_ref_panoramas)

    def retrieve_panorama_by_id(self, pano):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_panorama_by_id, pano)
        

    def insert_panorama(self, streetviewpanoramadata):
        with self._driver.session() as session:
            return session.write_transaction(self._create_update_panorama, streetviewpanoramadata)

    #TODO!!! IF NO BROWSER AVAILABLE LOOPS FOREVER!
    def _watch_requests(self, request_ids):
        
        redisCon = wssender.get_default_redis_connection()
        print(request_ids)
        while len(request_ids) > 0:
            for i in range(len(request_ids)):
                request_i = redisCon.get(request_ids[i])
                if request_i != b'pending':
                    request_i = request_i.decode('ascii')
                    request_i = json.loads(request_i)
                    request_i = request_i[next(iter(request_i.keys()))]
                    self.insert_panorama(request_i)
                    print(f'request_id {request_ids[i]} removed!')
                    request_ids.remove(request_ids[i])
                    break

        

    def _update_panorama_references(self):
        """
        Should retrieve Panorama references (incomplete Panorama nodes)
        from neo4j and then submit then to the GSVCollector
        in order for it to collect the Panoramas through GSVService.js
        (using a browser and a websocket).
        """
        # 1 - Collect reference nodes
        pano_refs = self.retrieve_ref_panoramas()

        # 2 - Collect a panorama for each reference node

        request_ids = []
        for pano in pano_refs:
            request_ids.append(wssender.collect_panorama(pano))

        # 3 - Insert all collected panoramas into the database
        t = threading.Thread(target=self._watch_requests, args=[request_ids])
        t.setDaemon(True)
        t.start()

        pass
        


    @staticmethod
    def _retrieve_ref_panoramas(tx):
        res = []
        for record in tx.run("MATCH(p:Panorama) WHERE NOT exists(p.location) "
                             "RETURN p.pano"):
            res.append(record["p.pano"])
        return res

    @staticmethod
    def _retrieve_panorama_by_id(tx, pano):
        result = tx.run(f"MATCH(p:Panorama {{pano: '{pano}'}}) RETURN p.pano")
        result = result.single()
        if result is not None:
            return result[0]
        else:
            return False

    @staticmethod
    def _create_update_panorama(tx, streetviewpanoramadata):
        """
        Creates a new node based on the panorama data.
        Notice that the neo4j query is constructed in such a way that
        each statement is ended with an white-space allowing new 
        statements to be inserted by just concatenating strings.
        """
        loc = streetviewpanoramadata['location']
        lat = loc['lat']
        lon = loc['lon']
        locprop = f"location:point({{x:{lon},y:{lat}}})"
        shortdescprop = f"shortDescription: {json.dumps(loc['shortDescription'])}"
        descprop = f"description: {json.dumps(loc['description'])}"
        copyright = f"copyright: \"{streetviewpanoramadata['copyright']}\""
        allprops = (
            f"{locprop}"
            f",{shortdescprop}"
            f",{descprop}"
            f",{copyright}"
        )
        # Query for creating/updating the node
        qNode = (
            f"MERGE (p:Panorama {{pano: {json.dumps(loc['pano'])}}}) "
            f"ON CREATE SET p += {{{allprops}}} "
            f"ON MATCH SET p += {{{allprops}}} "
            )
        qRel = ""
        nRel = 0
        if streetviewpanoramadata.get('links') is not None:
            for link in streetviewpanoramadata.get('links'):
                lDesc = f"description: {json.dumps(link['description'])}"
                lHead = f"heading: \"{link['heading']}\""
                allprops = (
                    f"{lDesc}"
                    f",{lHead}"
                )
                qRel += (
                    f"MERGE (p{nRel}:Panorama {{pano: {json.dumps(link['pano'])}}}) "
                    f"MERGE (p)-[l{nRel}:link]->(p{nRel}) "
                    f"ON CREATE SET l{nRel} += {{{allprops}}} "
                    f"ON MATCH SET l{nRel} += {{{allprops}}} "
                )
                nRel = nRel + 1
        panoStr = "' pano: ' + p.pano"
        shortDescriptionStr = "'\n shortDescription: ' + p.shortDescription "
        descriptionStr = "'\n description: ' + p.description "
        qRet = f"RETURN {panoStr} + {shortDescriptionStr} + {descriptionStr}"
        result = tx.run(qNode + qRel + qRet)
        print(qNode + qRel + qRet)
        return result.single()[0]
