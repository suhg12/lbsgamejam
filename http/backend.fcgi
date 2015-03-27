#!/usr/bin/python2
from flup.server.fcgi import WSGIServer
import time
import json
import mysql.connector
import ConfigParser
import types


def add_theme_suggestion(data, config, env):
    if not type(data) in types.StringTypes:
        return str(type(data))

    conn = mysql.connector.connect(
            host = config.get('database', 'host'),
            user = config.get('database', 'user'),
            passwd = config.get('database', 'password'),
            database = config.get('database', 'database'))
    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO ThemeSuggestions (`From`, `Theme`) VALUES (%s, %s)",
            (env['REMOTE_ADDR'], data))
        conn.commit()
    finally:
        conn.close()
            
    return "done";



POST_METHODS = {
            '/SuggestTheme': add_theme_suggestion
        }

GET_METHODS = {
        }

def app(environ, start_response):
    data = environ['QUERY_STRING']
    methods = GET_METHODS
    if environ['REQUEST_METHOD'] == 'POST':
        data = json.loads(environ['wsgi.input'].read())
        methods = POST_METHODS
        
    if environ['PATH_INFO'] in methods:
        config = ConfigParser.SafeConfigParser()
        config.read('../backend.conf')

        start_response('200 OK', [('Content-Type', 'application/json')])
        yield json.dumps(methods[environ['PATH_INFO']](data, config, environ))
    else:
        start_response('404 Page Not Found', [('Content-Type', 'application/json')])
        yield "Bad Endpoint"


if __name__ == '__main__':
    WSGIServer(app).run()
