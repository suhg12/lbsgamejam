#!/usr/bin/python2
from flup.server.fcgi import WSGIServer
import sys
import os
import time
import json
import mysql.connector
import ConfigParser
import types
import string
import random
import cgi


def validate_string(string):
    if not type(string) in types.StringTypes:
        return False
    elif string.strip() == "":
        return False
    else:
        return True

def validate_number(number):
    return type(number) == types.IntType


def create_error_result(code, info):
    return { 'Status': code, 'Info': info }


def database_insert(config, query, data):
    conn = mysql.connector.connect(
            host = config.get('database', 'host'),
            user = config.get('database', 'user'),
            passwd = config.get('database', 'password'),
            database = config.get('database', 'database'))
    cursor = conn.cursor()

    try:
        cursor.execute(query, data)
        conn.commit()
        return True
    except mysql.connector.Error as error:
        sys.stderr.write("MySQL error: {}".format(error))
        return False
    finally:
        cursor.close()
        conn.close()


def database_create_entry(config, code, name, link, desc, host):
    conn = mysql.connector.connect(
            host = config.get('database', 'host'),
            user = config.get('database', 'user'),
            passwd = config.get('database', 'password'),
            database = config.get('database', 'database'))
    cursor = conn.cursor()


    try:
        cursor.execute("SELECT Id FROM Participants WHERE KeyCode = %s", (code,))
        sys.stderr.write("Selected participant")
        for (participant) in cursor:

            sys.stderr.write("PartID: %d"%(participant[0]))
            sys.stderr.write("PartID: %s"%(str(type(participant[0]))))
            sys.stderr.write(name)
            sys.stderr.write(str(type(name)))
            sys.stderr.write(link)
            sys.stderr.write(str(type(link)))
            sys.stderr.write(desc)
            sys.stderr.write(str(type(desc)))
            sys.stderr.write(host)
            sys.stderr.write(str(type(host)))

            cursor.execute("INSERT INTO Entries (Participant, Name, Link, Description, Host) VALUES (%s, %s, %s, %s, %s)",
                (participant[0],
                    name,
                    link,
                    desc,
                    host,))
            conn.commit()
            return str(cursor.lastrowid)
        return 2
    except mysql.connector.Error as error:
        sys.stderr.write("MySQL error: {}".format(error))
        return 1
    finally:
        cursor.close()
        conn.close()


def add_theme_suggestion(data, config, env):
    if not type(data) in types.StringTypes:
        return str(type(data))

    database_insert(config,
            "INSERT INTO ThemeSuggestions (Host, Theme) VALUES (%s, %s)",
            (env['REMOTE_ADDR'], data))
            
    return "done";


def register_team(data, config, env):
    # validate inputs
    if not 'Name' in data or not validate_string(data['Name']):
        return create_error_result(1, 'name')

    if 'TeamName' in data and not validate_string(data['TeamName']):
        return create_error_result(1, 'team-name')

    if not 'TeamMembers' in data or not validate_number(data['TeamMembers']):
        return create_error_result(1, 'team-members')

    # generate key
    key = ''.join(random.SystemRandom().choice(string.uppercase + string.digits) for _ in xrange(5))

    # make database entry
    if not database_insert(config,
            "INSERT INTO Participants (Name, TeamName, TeamMembers, KeyCode, Host) VALUES (%s, %s, %s, %s, %s)",
            (data['Name'], data['TeamName'] if 'TeamName' in data else None, data['TeamMembers'], key, env['REMOTE_ADDR'])):
        return create_error_result(2, 'database error')
    else:
        return { 'Status': 0, 'Key': key }


def upload_entry(data, config, env):
    if int(env["CONTENT_LENGTH"]) > (50 * 1024 ** 2):
        return { 'Status': 2, 'Length': env["CONTENT_LENGTH"] }

    post = cgi.FieldStorage(
        fp=env['wsgi.input'],
        environ=env,
        keep_blank_values=True
    )

    if "archive" not in post:
        return { 'Status': 1 }

    filename = database_create_entry(config, '80HL4', "The Game", "http://www.thegame.org", "The game is a game.", env['REMOTE_ADDR'])
    if filename == 2:
        return {'Status': 3}
    elif filename == 1:
        return {'Status': 4, 'Message': 'database error'}

    fileitem = post["archive"]

    if fileitem.file:
        ext = fileitem.filename.decode('utf8').split('.')[-1]
        with open("../entries/%s.%s"%(filename, ext), 'wb') as output_file:
            while 1:
                data = fileitem.file.read(1024)
                # End of file
                if not data:
                    break
                output_file.write(data)

    return { 'Status': 0 }


POST_METHODS = {
            '/SuggestTheme': add_theme_suggestion,
            '/Register': register_team,
            '/UploadEntry': upload_entry
        }

GET_METHODS = {
        }

def app(environ, start_response):
    data = environ['QUERY_STRING']
    methods = GET_METHODS

    try:
        if environ['REQUEST_METHOD'] == 'POST':
            if not environ['PATH_INFO'] == "/UploadEntry":
                data = json.loads(environ['wsgi.input'].read())
            methods = POST_METHODS
    except ValueError:
        start_response('400 Bad Request', [('Content-Type', 'application/json')])
        return
        
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
