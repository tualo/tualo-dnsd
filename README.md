Description
===========

This server makes the Domain Name System transparent for you. 


Howto use
=========

You can simply start this server by calling:

    node bin/dnsd.js

After that you can open the url http://localhost:8010/ in a browser and watch 
all incomming dns requests, live.

To emulate a request call:
    
    dig @localhost -p 5353 google.com A
    
Or simply point a network device to the dns server.
