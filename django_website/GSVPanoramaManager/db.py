from neo4j import GraphDatabase

from GSVPanoramaManager import settings
from GSVPanoramaCollector import wssender
from django_website.settings_secret import GSV_KEY
from django_website.Primitives.GeoImage import GeoImage

import threading
import json
from datetime import datetime
import requests
import os
from pathlib import Path
import base64


class DBManager(object):

    def __init__(self):
        db_settings = settings.NEO4J_DATABASES['default']

        uri = 'bolt://' + db_settings['HOST'] + ':' + db_settings['PORT']
        auth = (db_settings['USER'], db_settings['PASSWORD'])

        self._driver = GraphDatabase.driver(uri, auth=auth, max_connection_lifetime=200)

        # This creates an uniqueness constraint over the 'pano' (panorama id)
        # property and as a consequence an index is also created.
        with self._driver.session() as session:
            session.run(
                "CREATE CONSTRAINT ON (p:Panorama) ASSERT p.pano IS UNIQUE")
            session.run(
                "CREATE INDEX ON :Panorama(location)")
        Path(settings.PICTURES_FOLDER).mkdir(parents=True, exist_ok=True)

    def close(self):
        self._driver.close()

    def redis_insert_pano_handler(self, redis_key, redis_val):
        redisCon = wssender.get_default_redis_connection()
        redis_val = redisCon.get(redis_key)
        redis_val = redis_val.decode('ascii')
        redis_val = json.loads(redis_val)
        # Tests if redis_val is an array of panoramas or a single panorama
        if (type(redis_val) is dict) and (not redis_val.get('location')):
            redis_val = redis_val[next(iter(redis_val.keys()))]
        self.insert_panorama(redis_val)

    def retrieve_ref_panoramas(self, limit=50, pano_seed=None):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_ref_panoramas, limit, pano_seed)

    

    def insert_panorama(self, panoramadata):
        try:    
            with self._driver.session() as session:
                return session.write_transaction(self._create_update_panorama, panoramadata)
        except:
            return panoramadata

    def _seed_panorama(self, seed_pano=None):
        """
        Since the database starts empty, in order to
        collect reference nodes it's important to have in it
        at least one node to be used as seed.
        """
        if seed_pano is None:
            seed_str_panoramadata = '{"9_P-g3LzyP2nTqpRYsJ4eA":{"location":{"lon":-46.73341431803249,"imageDate":null,"lat":-23.55733714144167,"shortDescription":"1380 Av. Prof. Luciano Gualberto","description":"1380 Av. Prof. Luciano Gualberto, São Paulo, State of São Paulo","pano":"9_P-g3LzyP2nTqpRYsJ4eA"},"copyright":"© 2019 Google","links":[{"description":"Av. Prof. Luciano Gualberto","heading":117.7491073608398,"pano":"S4itBmmAY-n8Kg5OLSoMbA"},{"description":"Av. Prof. Luciano Gualberto","heading":298.2005310058594,"pano":"pB9GU71lP4QdvReUn92neA"}],"tiles":{"centerHeading":297.3766174316406,"originHeading":297.3766174316406,"originPitch":0.40338134765625,"tileSize":{"b":"px","f":"px","height":512,"width":512},"worldSize":{"b":"px","f":"px","height":6656,"width":13312}},"time":[{"Af":null,"ng":null,"kf":null,"nf":null,"pano":"kokTxHGdiadnHNsy6V5d8g"},{"Af":null,"ng":null,"kf":null,"nf":null,"pano":"rZDQxOtFy1LuocgeMJ21Uw"},{"Af":null,"ng":null,"kf":null,"nf":null,"pano":"S6Vm8zW3zozIoWG5OAIdbg"},{"Af":null,"ng":null,"kf":null,"nf":null,"pano":"ZLPELffL0LEaIER3PDFAnQ"},{"Af":null,"ng":null,"kf":null,"nf":null,"pano":"OEJCBxXDnT_NaSVQqPV_rA"},{"Af":null,"ng":null,"kf":null,"nf":null,"pano":"9_P-g3LzyP2nTqpRYsJ4eA"}],"imageDate":"2017-07"}}'
            seed_json = json.loads(seed_str_panoramadata)
            seed_json = seed_json[next(iter(seed_json))]
            self.insert_panorama(seed_json)
        else:
            request_id = wssender.collect_panorama(seed_pano)
            if request_id is None:
                raise Exception((
            f"Invalid request_id ({request_id}), "
            f"is there any browser socket available?"
            ))

            t = wssender.watch_requests(
                request_ids=[request_id],
                handler=self.redis_insert_pano_handler,
                remove_redis_key=True)
            t.join(timeout=10.0)
            return not t.isAlive()

    @staticmethod
    def _imageURLBuilderForPanoId(pano_id, view):
        size = {'width': 640, 'height': 640}
        baseurl = "https://maps.googleapis.com/maps/api/streetview"
        queryString = (
            f"?size={size['width']}x{size['height']}"
            f"&pano={pano_id}"
            f"&heading={view['heading']}&pitch={view['pitch']}&key={GSV_KEY}"
        )

        unsigned_url = baseurl + queryString
        # signed_url = GoogleStreetViewProvider.sign_url(unsigned_url)
        # print(f'signed_url: {signed_url}')
        # return signed_url
        return unsigned_url

    def retrieve_filter_result_by_view(self, pano_id, view, filter_name):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_filter_result_by_view, pano_id, view, filter_name)

    @staticmethod
    def _retrieve_filter_result_by_view(tx, pano_id, view, filter_name):
        result = tx.run((
            f"MATCH (f:FilterResult)-[:{filter_name}]-(v:View)-[:view]-(p:Panorama {{pano: '{pano_id}'}}) "
            f"WHERE "
            f"floor(v.heading) = floor({view.get('heading')}) "
            f"AND "
            f"floor(v.pitch) = floor({view.get('pitch', 0)}) "
            f"RETURN properties(f) "
        ))

        result = result.single()
        if result is not None:
            return result[0]
        else:
            return False

    def retrieve_panorama_headings_pitchs(self, pano_id):
        with self._driver.session() as session:
            return session.write_transaction(
                self._retrieve_panorama_headings_pitchs,
                pano_id
            )

    @staticmethod
    def _retrieve_panorama_headings_pitchs(tx, pano_id):
        # BUXfV89b_wZglCY3gB8nCw
        result = tx.run((
            f"MATCH (p:Panorama {{pano: '{pano_id}'}})-[r:link]-(:Panorama)"
            f"RETURN r.heading, r.pitch"
        ))
        headings_pitchs = [(record['r.heading'], record['r.pitch'])
                           for record in result.records()]
        # pitchs = [record.get('r.pitch') for record in result.records()]
        return headings_pitchs

    def get_view_from_geoimage(self, geoImage: GeoImage, include_id=False):
        """
        Return a "view" node connected to the panorama with
        pano_id = geoImage.id and whose pitch and heading
        matches those of the given GeoImage.
        
        If include_id=True then returns a tuple:
        RETURN: (VIEW_ID, VIEW_DICT)
        """
        pano_id = geoImage.id
        pitch = geoImage.pitch
        heading = geoImage.heading

        view = self.retrieve_panorama_view(
            pano_id,
            target_heading=heading,
            heading_tolerance=10,
            target_pitch=pitch,
            pitch_tolerance = 1,
            include_id = include_id
        )

        if not view:
            return False
        
        return view
    
    def insert_comment_for_view(self, geoImage: GeoImage, user_id: str, comment: str):
        view = self.get_view_from_geoimage(geoImage, include_id=True)
        
        if not view:
            return False
        
        view_id = view[0]
        #view_data = view[1]

        with self._driver.session() as session:
            query = ((
                f"MATCH (v:View) WHERE id(v) = {view_id} "
                f"CREATE (v)-[:comment]-(vc:ViewComment "
                f'{{user_id: {user_id}, comment: "{comment}" }}) '
                ))
            session.run(query)
        return True
    
    def get_comments_for_view(self, geoImage: GeoImage, user_id: str = None):
        """
        Get the COMMENT nodes associated with a given view
        defined by the given geoImage (check 'get_view_from_geoimage'
        for more details about how a view is defined by a geoImage).

        If used_id is given then the comments are filtered based on the used_id.
        """
        view = self.get_view_from_geoimage(geoImage, include_id=True)
        
        if not view:
            return False
        
        view_id = view[0]
        #view_data = view[1]
        user_id_query = ""
        if user_id is not None:
            user_id_query = f"WHERE vc.user_id = {user_id}"

        with self._driver.session() as session:
            query = ((
                f"MATCH (v:View)-[:comment]-(vc:ViewComment) WHERE id(v) = {view_id} "
                f"{user_id_query} "
                f"RETURN vc.comment "
                ))
            ret = session.run(query)
            ret = ret.value()
            return ret
        


    def create_update_view(self, pano_id, target_heading, target_pitch):
        # Get pano or fill from url data?
        pano = self.retrieve_panorama_by_panoid(pano_id)
        if not pano:
            self._seed_panorama(pano_id)
        print(target_heading)
        print(target_pitch)
        tstr = ((
            f"MERGE (p:Panorama {{pano: '{pano_id}'}})"
            f"-[:view]-(v:View "
            f"{{heading: {target_heading}, pitch: {target_pitch}}}) "
            "RETURN properties(v) "
        ))
        with self._driver.session() as session:
            result = session.run(tstr)
            result = result.single()
            if result is not None:
                return result[0]
            else:
                raise Exception(
            (
                f"Error while creating new view. "
                f"Pano_id: {pano_id} "
                f"heading: {target_heading}, pitch: {target_pitch}"
            ))

    @staticmethod
    def _create_update_view(tx, pano_id, target_heading, target_pitch):
        #f"MATCH (p:Panorama {{pano: '{pano_id}'}}) "
        result = tx.run((
            f"MERGE (p:Panorama {{pano: '{pano_id}'}})-[:view]-(v:View {{heading: {target_heading}, pitch: {target_pitch}}}) "
            "RETURN properties(v) "
        ))
        result = result.single()
        if result is not None:
            return result[0]
        else:
            raise Exception(
        (
            f"Error while creating new view. "
            f"Pano_id: {pano_id} "
            f"heading: {target_heading}, pitch: {target_pitch}"
        ))

    def load_processed_data_for_geoImage(self, geoImage: GeoImage, filter_type: str):
        pano_id = geoImage.id
        # lon = geoImage.location.coordinates[0]
        # lat = geoImage.location.coordinates[1]        
        #processedDataList = geoImage.processedDataList

        view = self.get_view_from_geoimage(geoImage)

        if not view:
            return False

        img_filename = self.image_filename_from_panorama_parameters(
            pano_id,
            view
        )

        filter_result = self.retrieve_filter_result_by_view(
            pano_id, view, filter_type)

        if not filter_result:
            return False

        filter_path = os.path.join(
            settings.PICTURES_FOLDER,
            filter_type
        )

        filtered_image_filepath = os.path.join(
            filter_path,
            img_filename
        )

        if not os.path.exists(filtered_image_filepath):
            return False

        with open(filtered_image_filepath, 'rb') as img_file:
            return filter_result, base64.b64encode(img_file.read()).decode('ascii')

    def store_geoImage_as_view(self, geoImage: GeoImage):
        # TODO: Distinguish GSV nodes from other nodes
        # since the id could be something else than a pano_id
        pano_id = geoImage.id
        pitch = geoImage.pitch
        heading = geoImage.heading
        # lon = geoImage.location.coordinates[0]
        # lat = geoImage.location.coordinates[1]
        processedDataList = geoImage.processedDataList

        view = self.get_view_from_geoimage(geoImage)
        
        if not view:
            view = self.create_update_view(pano_id, heading, pitch)
        pano_url = self._imageURLBuilderForPanoId(
            pano_id,
            view
        )
        try:
            img_filename = self.image_filename_from_panorama_parameters(
                pano_id,
                view
            )
            image_path = os.path.join(settings.PICTURES_FOLDER,
                                        img_filename)
            image_exists = os.path.exists(image_path)
            if not image_exists:
                req = requests.get(pano_url)
                req.raise_for_status()
                with open(image_path, 'wb') as img_file:
                    img_file.write(req.content)
            
        except requests.exceptions.HTTPError as err:
            raise Exception(err)
        for filter_type in processedDataList:
            filter_result = self.retrieve_filter_result_by_view(
                pano_id, view, filter_type)
            if not filter_result:
                filter_result = processedDataList[filter_type]
                self.create_update_filter_result(
                    pano_id,
                    view, filter_result
                )
            filter_path = os.path.join(
                settings.PICTURES_FOLDER,
                filter_type
            )
            if not os.path.exists(filter_path):
                os.makedirs(filter_path)
            imageData = processedDataList[filter_type].imageData
            imageData = imageData.replace('data:image/jpeg;base64,', '')
            image_filter_path = os.path.join(filter_path,
                                                img_filename)
            if not os.path.exists(image_filter_path):
                with open(image_filter_path, 'wb') as img_file:
                    img_file.write(GeoImage.Base64ToImage(imageData))

        pass

    def create_update_filter_result(self, pano_id, view, filter_result):
        with self._driver.session() as session:
            return session.write_transaction(self._create_update_filter_result, pano_id, view, filter_result)

    @staticmethod
    def _create_update_filter_result(tx, pano_id, view, filter_result):
        allprops = f"filterId: '{filter_result.filterId}'"
        if filter_result.density is not None:
            allprops += f", density: {filter_result.density}"
        if filter_result.isPresent is not None:
            allprops += f", isPresent: '{filter_result.isPresent}' "
        result = tx.run((
            f"MATCH (p:Panorama {{pano: '{pano_id}'}})-[:view]-(v:View) "
            f"WHERE "
            f"floor(v.heading) = floor({view.get('heading')}) "
            f"AND "
            f"floor(v.pitch) = floor({view.get('pitch')}) "
            f"MERGE (p)-[:view]-(v)-[:{filter_result.filterId}]-(f:FilterResult) "
            f"ON CREATE SET f += {{{allprops}}} "
            f"ON MATCH SET f += {{{allprops}}} "
            "RETURN properties(f) "
        ))
        result = result.single()
        if result is not None:
            return result[0]
        else:
            return False

    #def _retrieve_local_image(self, pano_id, heading, pitch):
    def _retrieve_local_image(self, pano_id, view):
        """
        If the image is present then it retrieves it as a base64 string
        otherwise returns False
        """
        
        img_filename = self.image_filename_from_panorama_parameters(
            pano_id,
            view
        )
        img_path = os.path.join(settings.PICTURES_FOLDER,
                                img_filename)
        # with open(filtered_image_filepath, 'rb') as img_file:
        #    return filter_result, base64.b64encode(img_file.read()).decode('ascii')
        if os.path.exists(img_path):
            with open(img_path, 'rb') as img_file:
                return base64.b64encode(img_file.read()).decode('ascii')
        else:
            return False

    def _store_image_local(self, pano_id, view):
        pano_url = self._imageURLBuilderForPanoId(
            pano_id,
            view
            )
        img_filename = self.image_filename_from_panorama_parameters(
            pano_id,
            view
        )
        img_path = os.path.join(
            settings.PICTURES_FOLDER,
            img_filename
        )
        try:
            req = requests.get(pano_url)
            req.raise_for_status()
            with open(img_path, 'wb') as img_file:
                img_file.write(req.content)
            return True
        except requests.exceptions.HTTPError as err:
            raise Exception(err)
        return False

    def image_filename_from_panorama_parameters(self, pano_id, view):
        #TODO: Since the pitch spans mostly from -1 to 1 then
            #it needs a better representation than "int(float(pitch))""
        img_filename = (
                    f"_panoid_{pano_id}"
                    f"_heading_{int(float(view['heading']))}"
                    f"_pitch_{int(float(view['pitch']))}"
                    ".png"
                )
        return img_filename

    def _create_update_panorama_views(self, pano_ids):
        """

        """
        gsv_panorama_urls = []

        for pano_id in pano_ids:
            panorama = self.retrieve_panorama_by_panoid(pano_id)
            if not panorama:
                continue
            headings = panorama.get('centerHeading')
            pitchs = panorama.get('originPitch', 0)
            if headings is None:
                headings_pitchs =\
                    self.retrieve_panorama_headings_pitchs(pano_id)
            else:
                headings = [headings]
                pitchs = [pitchs]
            for heading, pitch in headings_pitchs:
                pitch = pitch or 0
                view = self.retrieve_panorama_view(
                    pano_id,
                    target_heading=heading,
                    heading_tolerance=10,
                    target_pitch=pitch,
                    pitch_tolerance=1)
                if not view:
                    view = self.create_update_view(pano_id, heading, pitch)
                img_filename =\
                    self.image_filename_from_panorama_parameters(
                    pano_id,
                    view
                )
                img_path = os.path.join(
                    settings.PICTURES_FOLDER,
                    img_filename
                )

                if not os.path.exists(img_path):
                    #Try to collect the image
                    if self._store_image_local(
                        pano_id,
                        view
                        ):
                        raise Exception("Something went wrong in image storing")
                gsv_panorama_urls.append(img_filename)
        return gsv_panorama_urls

    def retrieve_panorama_view(self,
                                pano_id,
                                target_heading,
                                heading_tolerance,
                                target_pitch,
                                pitch_tolerance,
                                include_id=False):
        # 7Ewkd2wQqDGGOcFlUZMfjw
        with self._driver.session() as session:
            return session.write_transaction(
                self._retrieve_panorama_view,
                pano_id, target_heading,
                heading_tolerance,
                target_pitch,
                pitch_tolerance,
                include_id)

    @staticmethod
    def _retrieve_panorama_view(tx,
        pano_id,
        target_heading,
        heading_tolerance,
        target_pitch,
        pitch_tolerance,
        include_id=False):
        returnStatement = "RETURN properties(v)"
        if include_id:
            returnStatement = "RETURN id(v), properties(v)"
        result = tx.run((
            f"MATCH (p:Panorama {{pano: '{pano_id}'}})-[:view]-(v:View) "
            f"WHERE {target_heading} - {heading_tolerance} "
            f"<= v.heading <= {target_heading} + {heading_tolerance} "
            f"{returnStatement}"
        ))
        result = result.single()
        if result is not None:
            if include_id:
                return (result[0], result[1])
            else:
                return result[0]
        else:
            return False

    def collect_panorama_by_location(self, coordinates, max_radius=10.):
        request_ids = []

        request_id = wssender.collect_panorama_by_location(
            coordinates, max_radius)
        if request_id is not None:
            request_ids.append(request_id)
        else:
            raise Exception(
                'Invalid request_id ({request_id}), is there any browser socket available?')
        t = wssender.watch_requests(
            request_ids=request_ids,
            handler=self.redis_insert_pano_handler,
            remove_redis_key=True)
        t.join()

        return self.retrieve_nearest_panorama(coordinates, max_radius)

    def _update_panorama_references(self, limit=50, pano_seed=None):
        """
        Should retrieve Panorama references (incomplete Panorama nodes)
        from neo4j and then submit then to the GSVCollector
        in order for it to collect the Panoramas through GSVService.js
        (using a browser and a websocket).
        """
        # def handler(redis_key, redis_val):
        #    redisCon = wssender.get_default_redis_connection()
        #    redis_val = redisCon.get(redis_key)
        #    redis_val = redis_val.decode('ascii')
        #    redis_val = json.loads(redis_val)
        #    redis_val = redis_val[next(iter(redis_val.keys()))]
        #    self.insert_panorama(redis_val)

        # 1 - Collect reference nodes
        pano_refs = self.retrieve_ref_panoramas(limit, pano_seed)

        # 2 - Collect a panorama for each reference node

        request_ids = []

        for pano in pano_refs:
            request_id = wssender.collect_panorama(pano)
            if request_id is not None:
                request_ids.append(request_id)
            else:
                raise Exception(
                    'Invalid request_id ({request_id}), is there any browser socket available?')

        t = wssender.watch_requests(
            request_ids=request_ids,
            handler=self.redis_insert_pano_handler,
            remove_redis_key=True)
        t.join()

        # 3 - Insert all collected panoramas into the database

        # The entire Python program exits when no alive non-daemon threads are left.
        # https://docs.python.org/3.6/library/threading.html#threading.Thread.setDaemon

    @staticmethod
    def _detect_disconnected_components(tx, root_id):
        result = tx.run((
            "MATCH (n:Panorama) SET n:Unreachable "
            "WITH count(n) AS dummy "
            "MATCH (root)-[*0..]-(n:Unreachable) "
            f"WHERE id(root) = {root_id} "  # 2646
            "REMOVE n:Unreachable "
            "WITH count(n) AS dummy "
            "MATCH (n:Unreachable) "
            "RETURN COUNT(n) "
        ))
        return result.single()[0]

    def retrieve_panoramas_for_street(self, street_name):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_panoramas_for_street, street_name)

    @staticmethod
    def _retrieve_panoramas_for_street(tx, street_name):
        result = []
        for record in tx.run((
            "MATCH (p:Panorama) "
            f"WHERE p.shortDescription = '{street_name}' "
            "RETURN properties(p)"
        )):
            result.append(record["properties(p)"])
        return result

    def retrieve_average_filter_result_density_for_street(self, street_name, filter_result_type=None):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_average_filter_result_density_for_street, street_name, filter_result_type)

    @staticmethod
    def _retrieve_average_filter_result_density_for_street(tx, street_name, filter_result_type=None):
        rel_type = '[]'
        if filter_result_type is not None:
            rel_type = f"[:{filter_result_type}]"
        result = tx.run((
            f"MATCH (p:Panorama)--(v:View)-{rel_type}-(f:FilterResult) "
            f"WHERE p.shortDescription CONTAINS '{street_name}' "
            "RETURN AVG(f.density)"
        ))
        result = result.single()
        if result is not None:
            return result[0]
        else:
            return False

    def retrieve_average_filter_result_density_in_bounding_box(self, bottom_left, top_right, filter_result_type=None):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_average_filter_result_density_in_bounding_box, bottom_left, top_right, filter_result_type)

    @staticmethod
    def _retrieve_average_filter_result_density_in_bounding_box(tx, bottom_left, top_right, filter_result_type=None):
        low_long = bottom_left[0]
        low_lat = bottom_left[1]
        high_long = top_right[0]
        high_lat = top_right[1]
        if filter_result_type is not None:
            rel_type = f"[:{filter_result_type}]"
        result = tx.run((
            f"MATCH (p:Panorama)--(v:View)-{rel_type}-(f:FilterResult) "
            f"WHERE point({{ longitude: {low_long}, latitude: {low_lat} }}) "
            f"<= p.location <= "
            f"point({{ longitude: {high_long}, latitude: {high_lat} }}) "
            "RETURN AVG(f.density)"
        ))
        result = result.single()
        if result is not None:
            return result[0]
        else:
            return False

    def retrieve_filter_results_for_street(self, street_name, filter_result_type=None):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_filter_results_for_street, street_name, filter_result_type)

    @staticmethod
    def _retrieve_filter_results_for_street(tx, street_name, filter_result_type=None):
        result = []
        rel_type = '[]'
        if filter_result_type is not None:
            rel_type = f"[:{filter_result_type}]"
        for record in tx.run((
            f"MATCH (p:Panorama)--(v:View)-{rel_type}-(f:FilterResult) "
            f"WHERE p.shortDescription = '{street_name}' "
            "RETURN properties(f) "
        )):
            result.append(record["properties(f)"])
        return result

    def retrieve_filter_results_in_bounding_box(self, bottom_left, top_right, filter_result_type=None):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_filter_results_in_bounding_box, bottom_left, top_right, filter_result_type)

    @staticmethod
    def _retrieve_filter_results_in_bounding_box(tx, bottom_left, top_right, filter_result_type=None):
        result = []
        low_long = bottom_left[0]
        low_lat = bottom_left[1]
        high_long = top_right[0]
        high_lat = top_right[1]
        rel_type = '[]'
        if filter_result_type is not None:
            rel_type = f"[:{filter_result_type}]"
        for record in tx.run((
            f"MATCH (p:Panorama)--(v:View)-{rel_type}-(f:FilterResult) "
            f"WHERE point({{ longitude: {low_long}, latitude: {low_lat} }}) "
            f"<= p.location <= "
            f"point({{ longitude: {high_long}, latitude: {high_lat} }}) "
            "RETURN properties(f) "
        )):
            result.append(record["properties(f)"])
        return result

    def retrieve_views_in_bounding_box(self, bottom_left, top_right):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_views_in_bounding_box, bottom_left, top_right)

    @staticmethod
    def _retrieve_views_in_bounding_box(tx, bottom_left, top_right):
        result = []
        low_long = bottom_left[0]
        low_lat = bottom_left[1]
        high_long = top_right[0]
        high_lat = top_right[1]
        for record in tx.run((
            "MATCH (p:Panorama)--(v:View) "
            f"WHERE point({{ longitude: {low_long}, latitude: {low_lat} }}) "
            f"<= p.location <= "
            f"point({{ longitude: {high_long}, latitude: {high_lat} }}) "
            "RETURN properties(v)"
        )):
            result.append(record["properties(v)"])
        return result

    def retrieve_panorama_subgraphs_in_bounding_box(self, bottom_left, top_right):
        """
        Retrieves panorama nodes whose location property
        is contained in a bouding box with botton left coordinate as
        "bottom_left" and top right coordinate as "top_right"
        notice that both bottom_left and top_right variables
        must be lists with coordinates [long, lat] in projection wsg84 (srid 4326).

        i.e.
        retrieve_panoramas_in_bounding_box(
            [-46.73277109852281, -23.55840302617493],
            [-46.731283366534626, -23.557581286342867])
        """
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_panorama_subgraphs_in_bounding_box, bottom_left, top_right)

    @staticmethod
    def _retrieve_panorama_subgraphs_in_bounding_box(tx, bottom_left, top_right):
        low_long = bottom_left[0]
        low_lat = bottom_left[1]
        high_long = top_right[0]
        high_lat = top_right[1]
        result = tx.run((
            "MATCH (left:Panorama)-[r:link]->(right:Panorama) "
            f"WHERE point({{ longitude: {low_long}, latitude: {low_lat} }}) "
            f"<= left.location <= "
            f"point({{ longitude: {high_long}, latitude: {high_lat} }}) "
            "and "
            f"point({{ longitude: {low_long}, latitude: {low_lat} }}) "
            f"<= right.location <= "
            f"point({{ longitude: {high_long}, latitude: {high_lat} }}) "
            "RETURN left,r,right"
        ))
        result = [record for record in result]

        return result

    def retrieve_nearest_panorama(self, coordinates, max_radius=10.):
        """
        Retrieves panorama nodes whose location property
        is contained in a bouding box centered at the coordinates
        given with a side with max_radius meters (defaults to 10 meters).

        Notice that an approximation is used to convert meters to degrees
        so the max_radius should be small.

        The coordinates are assumed to be in WGS-84 (srid 4326) projection
        in [longitude, latitude] order.

        ref: https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters

        i.e.
        retrieve_nearest_panorama(
            [-46.73277109852281, -23.55840302617493],
            50)
        """
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_nearest_panorama, coordinates, max_radius)

    @staticmethod
    def _retrieve_nearest_panorama(tx, coordinates, max_radius=10.):
        # ref: https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
        simple_approximation = (max_radius/111111.)

        lng = coordinates[0]
        lat = coordinates[1]
        lower_point_str = ((
            f"point("
            f"{{longitude: {lng - simple_approximation}, "
            f"latitude: {lat - simple_approximation}}}"
            f")"
            ))
        upper_point_str = f"point({{ longitude: {lng+simple_approximation}, latitude: {lat+simple_approximation} }})"
        point_str = f"point({{ longitude: {lng}, latitude: {lat} }}) "
        result = tx.run((
            "MATCH (p:Panorama) "
            f"WHERE  {lower_point_str} "
            "<= p.location <= "
            f"{upper_point_str} "
            f"RETURN properties(p) "
            f"ORDER BY distance({point_str}, p.location) "
            "LIMIT 1 "
        ))
        result = result.single()
        if result is not None:
            return result[0]
        else:
            return False

    def retrieve_panoramas_in_bounding_box(self, bottom_left, top_right):
        """
        Retrieves panorama nodes whose location property
        is contained in a bouding box with botton left coordinate as
        "bottom_left" and top right coordinate as "top_right"
        notice that both bottom_left and top_right variables
        must be lists with coordinates [long, lat] in projection wsg84 (srid 4326).

        i.e.
        retrieve_panoramas_in_bounding_box(
            [-46.73277109852281, -23.55840302617493],
            [-46.731283366534626, -23.557581286342867])
        """
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_panoramas_in_bounding_box, bottom_left, top_right)

    @staticmethod
    def _retrieve_panoramas_in_bounding_box(tx, bottom_left, top_right):
        result = []
        low_long = bottom_left[0]
        low_lat = bottom_left[1]
        high_long = top_right[0]
        high_lat = top_right[1]
        for record in tx.run((
            "MATCH (p:Panorama) "
            f"WHERE point({{ longitude: {low_long}, latitude: {low_lat} }}) "
            f"<= p.location <= "
            f"point({{ longitude: {high_long}, latitude: {high_lat} }}) "
            "RETURN properties(p)"
        )):
            result.append(record["properties(p)"])
        return result

    @staticmethod
    def _retrieve_ref_panoramas(tx, limit=50, pano_seed=None):
        res = []
        # Q0VXNm1-gLkAAAQqz_mXHQ
        if pano_seed is not None:
            match = f"MATCH(p:Panorama)-[:link*]-(:Panorama {{pano: '{pano_seed}'}}) WHERE NOT exists(p.location) "
        else:
            match = "MATCH(p:Panorama) WHERE NOT exists(p.location) "
        for record in tx.run((
            match
            + f" RETURN p.pano LIMIT {limit}"
        )):
            res.append(record["p.pano"])
        return res

    def retrieve_panorama_by_panoid(self, pano):
        with self._driver.session() as session:
            return session.write_transaction(self._retrieve_panorama_by_panoid, pano)

    @staticmethod
    def _retrieve_panorama_by_panoid(tx, pano):
        result = tx.run(
            f"MATCH(p:Panorama {{pano: '{pano}'}}) RETURN properties(p)")
        result = result.single()
        if result is not None:
            return result[0]
        else:
            return False

    @staticmethod
    def _create_update_panorama(tx, panoramadata):
        """
        Creates a new node based on the panorama data.
        Notice that the neo4j query is constructed in such a way that
        each statement is ended with an white-space allowing new 
        statements to be inserted by just concatenating strings.
        """
        #print(panoramadata)
        loc = panoramadata['location']
        lat = loc['lat']
        lon = loc['lon']
        locprop = f"location:point({{ longitude:{lon}, latitude: {lat}}})"
        shortdescprop = f"shortDescription: {json.dumps(loc['shortDescription'])}"
        descprop = f"description: {json.dumps(loc['description'])}"
        copyright = f"copyright: \"{panoramadata['copyright']}\""
        tiles = panoramadata['tiles']
        centerHeading = f"centerHeading: {tiles['centerHeading']}"
        originHeading = f"originHeading: {tiles['originHeading']}"
        originPitch = f"originPitch: {tiles['originPitch']}"
        imageDate = f"imageDate: \"{panoramadata['imageDate']}\""
        allprops = (
            f"{locprop}"
            f",{shortdescprop}"
            f",{descprop}"
            f",{copyright}"
            f",{centerHeading}"
            f",{originHeading}"
            f",{originPitch}"
            f",{imageDate}"
        )
        # Query for creating/updating the node
        qNode = (
            f"MERGE (p:Panorama {{pano: {json.dumps(loc['pano'])}}}) "
            f"ON CREATE SET p += {{{allprops}}} "
            f"ON MATCH SET p += {{{allprops}}} "
        )
        qRel = ""
        nRel = 0
        if panoramadata.get('links') is not None:
            for link in panoramadata.get('links'):
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
        # ["time"][0]["kf"].getDate()
        tRel = ""
        ntRel = 0
        if panoramadata.get('time') is not None:
            for time in panoramadata.get('time'):
                # DEPRECATED: kf is the property containing the datetime
                # nf is the property containing the datetime
                # timeDate = str(datetime.strptime(
                #    time['kf'], "%Y-%m-%dT%H:%M:%S.%fZ").date())
                timePano = json.dumps(time['pano'])
                if json.dumps(loc['pano']) == timePano:
                    continue
                tRel += (
                    f"MERGE (pt{ntRel} {{pano: {timePano}}}) "
                    f"ON CREATE SET pt{ntRel}:Time "
                    f"ON MATCH SET pt{ntRel}:Time "
                    f"MERGE (p)-[t{ntRel}:time]->(pt{ntRel}) "
                    #f"ON CREATE SET pt{ntRel} += {{date: date('{timeDate}')}} "
                    #f"ON MATCH SET pt{ntRel} += {{date: date('{timeDate}')}} "
                )
                ntRel = ntRel + 1
        panoStr = "' pano: ' + p.pano"
        shortDescriptionStr = "'\n shortDescription: ' + p.shortDescription "
        descriptionStr = "'\n description: ' + p.description "
        qRet = f"RETURN {panoStr} + {shortDescriptionStr} + {descriptionStr}"
        # print(qNode + qRel + qRet)
        #result = tx.run(qNode + qRel + tRel + qRet)
        # return result.single()[0]
        tx.run(qNode + qRel + tRel + qRet)
        return True