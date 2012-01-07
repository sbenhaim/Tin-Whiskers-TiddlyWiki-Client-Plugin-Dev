# A basic configuration.
# Run "pydoc tiddlyweb.config" for details on configuration items.

config = {
    'secret': 'f92be483bc38b4fd947a12c9fb6c0ef23613e771',
    'server_store': ['tiddlywebplugins.devstore', {'store_root': 'store'}],
    'log_level': 'DEBUG',
    'system_plugins': ['tiddlywebwiki'],
    'twanager_plugins': ['tiddlywebwiki'],
    'local_instance_tiddlers': {'system': ['BrowserHistoryPlugin.js']},
}
