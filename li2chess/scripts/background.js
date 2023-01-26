function isChessComVersion2(url) {
    if (url.indexOf('live.chess.com') >= 0) {
        return true;
    }
    return false;
}

function getGameId(url) {

    refIndex = url.indexOf('live/game/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'live/game/'.length);
    }

    refIndex = url.indexOf('game/daily/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'game/daily/'.length);
    }
    
    refIndex = url.indexOf('#');
    var ref = refIndex >= 0 ? url.slice(refIndex + 1) : '';
    if (ref.indexOf('g') == 0) {
        return ref.split('=')[1];
    }
    return '';
}

chrome.action.onClicked.addListener(async function(tab) {
    var onDone = function(pgn) {
        if (!pgn)
            return;
        if (tab.url.indexOf("live#a=") > -1 || 
            (pgn.indexOf('[Result ') > -1 && pgn.indexOf('[Result "*"]') < 0) ||
            (pgn.indexOf('[Result "*"]') > -1 && pgn.indexOf(' won on time') > -1))
        {
            let tabId;
            chrome.tabs.create({
                url: "http://" + chrome.i18n.getUILanguage().split('-')[0] + ".lichess.org/paste"
            }, function(tab) {
                tabId = tab.id;
            });
            chrome.tabs.onUpdated.addListener(function(id, info) {
                setTimeout(() => {
                    if (id == tabId && info.status == "complete" && info.status != "aborted" && pgn != null) {
                        chrome.tabs.sendMessage(tabId, pgn);
                        pgn = null;
                    }
                }, 100);
            });
        } else {
            return notFinished(tab.id);
        }
    };

    var results = await getPgn(tab.id, "chessCom");
    onDone(results);

});

async function getPgn(tabId, site, ...args) {
    return await chrome.tabs.sendMessage(tabId, {action: "getPgn", site, actionArgs: args});
}

async function notFinished(tabId, site, ...args)
{
    return await chrome.tabs.sendMessage(tabId, {action: "notFinished", site, actionArgs: args});
}

