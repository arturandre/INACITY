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

    def insertPanorama(self, streetviewpanoramadata):
        with self._driver.session() as session:
            session.write_transaction(self._create_update_panorama, streetviewpanoramadata)


        
    #### REFERENCE CODE - @TODO: REMOVE
    def print_greeting(self, message):
        with self._driver.session() as session:
            greeting = session.write_transaction(self._create_and_return_greeting, message)
            print(greeting)

    @staticmethod
    def _create_update_panorama(tx, streetviewpanoramadata):
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
        tx.run(qNode + qRel)
        return True



    @staticmethod
    def _create_and_return_greeting(tx, message):
        result = tx.run("CREATE (a:Greeting) "
                        "SET a.message = $message "
                        "RETURN a.message + ', from node ' + id(a)", message=message)
        return result.single()[0]
    #### REFERENCE CODE - @TODO: REMOVE