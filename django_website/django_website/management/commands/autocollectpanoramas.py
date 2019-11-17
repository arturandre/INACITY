from GSVPanoramaManager.db import DBManager
#import subprocess
from time import sleep
import os
import asyncio
from pyppeteer import launch
import pyppeteer
from datetime import datetime

current_browser = None
x = None

async def start_headless_browser():
    import pyppeteer
    global current_browser
    browser = await pyppeteer.launch(args=['--no-sandbox'], headless=True)
    page = await browser.newPage()
    await page.goto('http://localhost/gsvpanoramacollector/link_browser/default/')
    try:
        print("await page.waitForNavigation({'waitUntil': 'load', 'timeout': 3000})")
        await page.waitForNavigation({'waitUntil': 'load', 'timeout': 3000})
        #print('waiting for navigation')
        #await page.waitForNavigation({'timeout': 5000})
    except Exception as e:
        print(e)
        
    

    
    current_browser = browser
    


async def stop_headless_browser():
    global current_browser
    if current_browser is not None:
        await current_browser.close()

#asyncio.get_event_loop().run_until_complete(start_headless_browser())
#x = DBManager()

#c = '/usr/bin/chromium --headless --disable-gpu --no-sandbox --remote-debugging-port=9222 http://localhost/gsvpanoramacollector/link_browser/default/'.split(' ')
#c = '/usr/bin/google-chrome-stable --headless --disable-gpu --no-sandbox --remote-debugging-port=9222 http://localhost/gsvpanoramacollector/link_browser/default/'
#process = subprocess.Popen(c, stdout=subprocess.PIPE)

#print('process opened, waiting 5 seconds to start...')
#sleep(5)
print('Starting!')
iterations = 1
while True:
    print(f'Collecting...')
    try:
        asyncio.get_event_loop().run_until_complete(start_headless_browser())
        print('x = DBManager()')
        x = DBManager()
        print('x._update_panorama_references()')
        print(datetime.now().time())
        x._update_panorama_references()
        print(f'Success: {iterations}')
        iterations += 1
        if iterations % 20 == 0:
            print(f'20 successes, restarting neo4j to avoid the memory leak issue...')
            os.system('neo4j restart')
            sleep(5)
        print('x.close()')
        x.close()
        print('asyncio.get_event_loop().run_until_complete(stop_headless_browser())')
        asyncio.get_event_loop().run_until_complete(stop_headless_browser())
    except:
        print(f'Failed (iteration {iterations}) updating trying to reset chromium')
        #process.kill()
        asyncio.get_event_loop().run_until_complete(stop_headless_browser())
        if x is not None:
            x.close()
        #process = subprocess.Popen(c, stdout=subprocess.PIPE)
        asyncio.get_event_loop().run_until_complete(start_headless_browser())
        #sleep(5)
    finally:
        #process.kill()
        asyncio.get_event_loop().run_until_complete(stop_headless_browser())

