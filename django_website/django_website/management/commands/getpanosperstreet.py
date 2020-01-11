from django.core.management.base import BaseCommand

from neo4j import GraphDatabase
from GSVPanoramaManager import settings
import re

class Command(BaseCommand):
    help = """Creates a csv file with all the addresses and
    how many panoramas are associated with each address
    """


    def handle(self, *args, **options):
        self.stdout.write("Opening neo4j connection")
        db_settings = settings.NEO4J_DATABASES['default']
        uri = 'bolt://' + db_settings['HOST'] + ':' + db_settings['PORT']
        auth = (db_settings['USER'], db_settings['PASSWORD'])
        _driver = GraphDatabase.driver(uri, auth=auth)
        self.stdout.write("Starting session for panoramas")
        with _driver.session() as session:
            
            shortDescriptionGroups = session.run((
                "MATCH (p:Panorama)"
                "RETURN DISTINCT(p.shortDescription), COUNT(p)"
            ))
            shortDescriptionGroups = shortDescriptionGroups.values()
            import re
            temp = []
            for y in shortDescriptionGroups:
                try:
                    if y[0] is None:
                        continue
                    temp.append([re.sub(r'^\d+\s(\w)', r'\1', y[0]), y[1]])
                except:
                    print(f'Error: y: {y} ---')
                    raise Exception()
                #shortDescriptionGroups = [ for y in shortDescriptionGroups]
            shortDescriptionGroups = temp
            
            #addressDict = dict.fromkeys([y[0] for y in shortDescriptionGroups], 0)
            addressDict = dict.fromkeys([y[0] for y in shortDescriptionGroups], None)
            for address in shortDescriptionGroups:
                if addressDict[address[0]] is None:
                    addressDict[address[0]] = {
                        "count": 0,
                        "length": -1
                    }
                addressDict[address[0]]["count"] += address[1]
                #raise Exception(addressDict[address[0]])
            with open('export_20200109_address_panoramas.csv', 'w+') as expf:
                #Header
                expf.write('Address,panorama counting, length'+'\n')
                for address in addressDict.keys():
                    #Length already divided by two to account
                    #for going foward and backwards.
                    addressNeo4j = address.replace('"', '\\"')
                    addressLength = session.run((
                        f'MATCH (root:Panorama)-[:link]->(next:Panorama) '
                        f'WHERE '
                        f'root.shortDescription CONTAINS "{addressNeo4j}" '
                        f'and '
                        f'next.shortDescription CONTAINS "{addressNeo4j}" '
                        f'RETURN SUM(distance('
                        f'point({{longitude: root.location.x, latitude: root.location.y}}), '
                        f'point({{longitude: next.location.x, latitude: next.location.y}})))/2'
                        )).single()[0]
                    addressDict[address]["length"] = addressLength
                    expf.write((
                        f"{address},"
                        f'{str(addressDict[address]["count"])},'
                        f'{str(addressDict[address]["length"])}'
                        "\n"
                        ))
