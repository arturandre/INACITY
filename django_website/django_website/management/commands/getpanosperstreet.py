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
            
            addressDict = dict.fromkeys([y[0] for y in shortDescriptionGroups], 0)
            for address in shortDescriptionGroups:
                addressDict[address[0]] += address[1]
            with open('export_address_panoramas.csv', 'w+') as expf:
                for k, v in addressDict.items():
                    expf.write(k+','+str(v)+'\n')
