requirejs.config({
    paths: {
        chitu: 'Scripts/chitu',
        hammer: 'Scripts/hammer',
        iscroll: 'iscroll-probe',
        jquery: 'Scripts/jquery-2.1.4',
        move: 'Scripts/move'
    }
});
requirejs(['tests', 'application-test']);
