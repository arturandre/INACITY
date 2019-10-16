from neo4j import GraphDatabase

from GSVPanoramaManager import settings

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

    def retrieve_panorama_by_id(self, pano):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_panorama_by_id, pano)
        

    def insert_panorama(self, streetviewpanoramadata):
        with self._driver.session() as session:
            return session.write_transaction(self._create_update_panorama, streetviewpanoramadata)

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
        shortdescprop = f"shortDescription: \"{loc['shortDescription']}\""
        descprop = f"description: \"{loc['description']}\""
        copyright = f"copyright: \"{streetviewpanoramadata['copyright']}\""
        allprops = (
            f"{locprop}"
            f",{shortdescprop}"
            f",{descprop}"
            f",{copyright}"
        )
        # Query for creating/updating the node
        qNode = (
            f"MERGE (p:Panorama {{pano: \"{loc['pano']}\"}}) "
            f"ON CREATE SET p += {{{allprops}}} "
            f"ON MATCH SET p += {{{allprops}}} "
            )
        qRel = ""
        nRel = 0
        if streetviewpanoramadata.get('links') is not None:
            for link in streetviewpanoramadata.get('links'):
                lDesc = f"description: \"{link['description']}\""
                lHead = f"heading: \"{link['heading']}\""
                allprops = (
                    f"{lDesc}"
                    f",{lHead}"
                )
                qRel += (
                    f"MERGE (p)-[l{nRel}:link]->(:Panorama {{pano: \"{link['pano']}\"}}) "
                    f"ON CREATE SET l{nRel} += {{{allprops}}} "
                    f"ON MATCH SET l{nRel} += {{{allprops}}} "
                )
                nRel = nRel + 1
        panoStr = "' pano: ' + p.pano"
        shortDescriptionStr = "'\n shortDescription: ' + p.shortDescription "
        descriptionStr = "'\n description: ' + p.description "
        qRet = f"RETURN {panoStr} + {shortDescriptionStr} + {descriptionStr}"
        result = tx.run(qNode + qRel + qRet)
        return result.single()[0]