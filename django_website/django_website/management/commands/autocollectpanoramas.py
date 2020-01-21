from django.core.management.base import BaseCommand

from GSVPanoramaManager.db import DBManager
#import subprocess
from time import sleep
import os
import asyncio
from pyppeteer import launch
import pyppeteer
from datetime import datetime

import sys, traceback

current_browser = None
x = None

class Command(BaseCommand):
    help = """
    Starts a headless browser, queries for unfufilled panoramas
    at the neo4j database, collects them using the browser
    and finally stores the collected panorama at the neo4j
    database, fulfilling the unfulfilled panoramas.

    Requires pyppeteer
    """


    async def start_headless_browser(self):
        import pyppeteer
        global current_browser
        browser = await pyppeteer.launch(args=['--no-sandbox'], headless=True)
        page = await browser.newPage()
        await page.goto('http://localhost/gsvpanoramacollector/link_browser/default/')
        try:
            self.stdout.write("await page.waitForNavigation({'waitUntil': 'load', 'timeout': 5000})")
            await page.waitForNavigation({'waitUntil': 'load', 'timeout': 5000})
            #self.stdout.write('waiting for navigation')
            #await page.waitForNavigation({'timeout': 5000})
        #except Exception as e:
        except Exception:
            #print(f'2 e.__str__(): {e.__str__()}')
            traceback.print_exc(file=sys.stdout)
            
        

        
        current_browser = browser
        


    async def stop_headless_browser(self):
        global current_browser
        if current_browser is not None:
            await current_browser.close()

    def handle(self, *args, **options):
        try_seeding = True
        #asyncio.get_event_loop().run_until_complete(start_headless_browser())
        #x = DBManager()

        #c = '/usr/bin/chromium --headless --disable-gpu --no-sandbox --remote-debugging-port=9222 http://localhost/gsvpanoramacollector/link_browser/default/'.split(' ')
        #c = '/usr/bin/google-chrome-stable --headless --disable-gpu --no-sandbox --remote-debugging-port=9222 http://localhost/gsvpanoramacollector/link_browser/default/'
        #process = subprocess.Popen(c, stdout=subprocess.PIPE)

        #self.stdout.write('process opened, waiting 5 seconds to start...')
        #sleep(5)
        self.stdout.write('Starting!')

        iterations = 1
        while True:
            self.stdout.write(f'Collecting...')
            try:
                self.stdout.write('Starting DBManager')
                x = DBManager()
                self.stdout.write('Starting headless browser')
                asyncio.get_event_loop().run_until_complete(self.start_headless_browser())
                self.stdout.write('x = DBManager()')
                if try_seeding:
                    try_seeding = False
                    self.stdout.write('Trying to seed')
                    x._seed_panorama()
                
                self.stdout.write('x._update_panorama_references()')
                self.stdout.write(f'{datetime.now().time()}')
                x._update_panorama_references()
                self.stdout.write(f'Success: {iterations}')
                iterations += 1
                if iterations % 20 == 0:
                    self.stdout.write(f'20 successes, restarting neo4j to avoid the memory leak issue...')
                    os.system('neo4j restart')
                    sleep(5)
                self.stdout.write('x.close()')
                x.close()
                self.stdout.write('asyncio.get_event_loop().run_until_complete(stop_headless_browser())')
                asyncio.get_event_loop().run_until_complete(self.stop_headless_browser())
            except Exception as e:
                self.stdout.write(f'Failed (iteration {iterations}) updating trying to reset chromium')
                #print(f'e.__str__(): {e.__str__()}')
                traceback.print_exc(file=sys.stdout)
                #process.kill()
                asyncio.get_event_loop().run_until_complete(self.stop_headless_browser())
                if x is not None:
                    x.close()
                #process = subprocess.Popen(c, stdout=subprocess.PIPE)
                asyncio.get_event_loop().run_until_complete(self.start_headless_browser())
                #sleep(5)
            finally:
                #process.kill()
                asyncio.get_event_loop().run_until_complete(self.stop_headless_browser())

