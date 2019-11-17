from neo4j import GraphDatabase
from GSVPanoramaManager import settings

def format_panorama_csv(panorama_row):
    pid = str(panorama_row[0])
    pdict = panorama_row[1]
    centerHeading = str(pdict.get('centerHeading', ''))
    copyright = pdict.get('copyright', '')
    description = pdict.get('description', '')
    imageDate = pdict.get('imageDate', '')
    location = str(pdict.get('location', ''))
    originHeading = str(pdict.get('originHeading', ''))
    originPitch = str(pdict.get('originPitch', ''))
    pano = pdict.get('pano', '')
    shortDescription = pdict.get('shortDescription', '')
    return (
        pid + ';' +
        centerHeading + ';' +
        copyright + ';' +
        description + ';' +
        imageDate + ';' +
        location + ';' +
        originHeading + ';' +
        originPitch + ';' +
        pano + ';' +
        shortDescription
    )

def format_link_csv(link_row):
    a_id = str(link_row[0])
    b_id = str(link_row[1])
    pdict = link_row[2]
    heading = str(pdict.get('heading', ''))
    description = pdict.get('description', '')
    return (
        a_id + ';' +
        b_id + ';' +
        heading + ';' +
        description
    )

def format_view_csv(view_row):
    p_id = str(view_row[0])
    v_id = str(view_row[1])
    pdict = view_row[2]
    heading = str(pdict.get('heading', ''))
    pitch = str(pdict.get('pitch', ''))
    return (
        p_id + ';' +
        v_id + ';' +
        heading + ';' +
        pitch
    )

def format_filter_result_csv(filter_result_row):
    v_id = str(filter_result_row[0])
    f_id = str(filter_result_row[1])
    pdict = filter_result_row[2]
    filterId = pdict.get('filterId', '')
    density = str(pdict.get('density', ''))
    return (
        v_id + ';' +
        f_id + ';' +
        filterId + ';' +
        density
    )


print("Opening neo4j connection")
db_settings = settings.NEO4J_DATABASES['default']
uri = 'bolt://' + db_settings['HOST'] + ':' + db_settings['PORT']
auth = (db_settings['USER'], db_settings['PASSWORD'])
_driver = GraphDatabase.driver(uri, auth=auth)
print("Starting session for panoramas")
with _driver.session() as session:
    minmax_ids = session.run((
        "MATCH (p:Panorama) "
        "RETURN MIN(ID(p)), MAX(ID(p))"
    ))
    minmax_ids = minmax_ids.values()[0]
    print(f"Min ID: {minmax_ids[0]}, Max ID: {minmax_ids[1]}")
    stepSize = 100000
    lb = minmax_ids[0]
    hb = min(lb + stepSize, minmax_ids[1])
    while lb < minmax_ids[1]:
        print(f"Collecting panoramas from {lb} to {hb}")
        panoramas = session.run((
            "MATCH (p:Panorama) "
            "WHERE "
            f"ID(p) >= {lb} "
            "AND "
            f"ID(p) <= {hb} "
            "RETURN ID(p), properties(p)"
        ))

        panoramas = panoramas.values()
        
        print(f"Writing panoramas from {lb} to {hb} to CSV file")
        with open('export_panoramas.csv', 'a+') as expfile:
            for panorama in panoramas:
                csvpano = format_panorama_csv(panorama)
                expfile.write(csvpano+'\n')
                #break

        lb += stepSize+1
        hb = min(lb + stepSize, minmax_ids[1])

print('Starting session for links')
with _driver.session() as session:
    minmax_ids = session.run((
        "MATCH (a:Panorama)-[l:link]-(b:Panorama) "
        "RETURN MIN(ID(l)),MAX(ID(l))"
    ))
    minmax_ids = minmax_ids.values()[0]
    print(f"Min ID: {minmax_ids[0]}, Max ID: {minmax_ids[1]}")
    stepSize = 100000
    lb = minmax_ids[0]
    hb = min(lb + stepSize, minmax_ids[1])
    while lb < minmax_ids[1]:
        print(f"Collecting links from {lb} to {hb}")
        links = session.run((
            "MATCH (a:Panorama)-[l:link]-(b:Panorama) "
            "WHERE "
            f"ID(l) >= {lb} "
            "AND "
            f"ID(l) <= {hb} "
            "RETURN ID(a), ID(b), properties(l)"
        ))

        links = links.values()
        
        print(f"Writing links from {lb} to {hb} to CSV file")
        with open('export_links.csv', 'a+') as expfile:
            for link in links:
                csvlink = format_link_csv(link)
                expfile.write(csvlink+'\n')
                #break

        lb += stepSize+1
        hb = min(lb + stepSize, minmax_ids[1])
        #break

print('Starting session for views')
with _driver.session() as session:
    minmax_ids = session.run((
        "MATCH (p:Panorama)-[]->(v:View) "
        "RETURN MIN(ID(v)),MAX(ID(v))"
    ))
    minmax_ids = minmax_ids.values()[0]
    print(f"Min ID: {minmax_ids[0]}, Max ID: {minmax_ids[1]}")
    stepSize = 100000
    lb = minmax_ids[0]
    hb = min(lb + stepSize, minmax_ids[1])
    while lb < minmax_ids[1]:
        print(f"Collecting views from {lb} to {hb}")
        views = session.run((
            "MATCH (p:Panorama)-[]->(v:View) "
            "WHERE "
            f"ID(v) >= {lb} "
            "AND "
            f"ID(v) <= {hb} "
            "RETURN ID(p), ID(v), properties(v)"
        ))

        views = views.values()
        
        print(f"Writing views from {lb} to {hb} to CSV file")
        with open('export_views.csv', 'a+') as expfile:
            for view in views:
                csvview = format_view_csv(view)
                expfile.write(csvview+'\n')
                #break

        lb += stepSize+1
        hb = min(lb + stepSize, minmax_ids[1])
        #break

print('Starting session for filter result')
with _driver.session() as session:
    minmax_ids = session.run((
        "MATCH (v:View)-[]->(f:FilterResult) "
        "RETURN MIN(ID(f)),MAX(ID(f))"
    ))
    minmax_ids = minmax_ids.values()[0]
    print(f"Min ID: {minmax_ids[0]}, Max ID: {minmax_ids[1]}")
    stepSize = 100000
    lb = minmax_ids[0]
    hb = min(lb + stepSize, minmax_ids[1])
    while lb < minmax_ids[1]:
        print(f"Collecting filter results from {lb} to {hb}")
        filter_results = session.run((
            "MATCH (v:View)-[]->(f:FilterResult) "
            "WHERE "
            f"ID(f) >= {lb} "
            "AND "
            f"ID(f) <= {hb} "
            "RETURN ID(v), ID(f), properties(f)"
        ))

        filter_results = filter_results.values()
        
        print(f"Writing filter results from {lb} to {hb} to CSV file")
        with open('export_filter_results.csv', 'a+') as expfile:
            for fr in filter_results:
                csvfr = format_filter_result_csv(fr)
                expfile.write(csvfr+'\n')
                #break

        lb += stepSize+1
        hb = min(lb + stepSize, minmax_ids[1])
        #break

#format_filter_result_csv