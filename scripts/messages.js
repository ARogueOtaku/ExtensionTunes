let sendMessage = (type, subtype=type, messageObject, responseHandler) =>{
    let message = {
        type: type,
        subtype: subtype,
        content: messageObject
    }
    chrome.runtime.sendMessage(message, responseHandler);
}

let receiveMessage = handler =>{
    chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
        let response = handler(message, sender);
        sendResponse(response);
    });
}