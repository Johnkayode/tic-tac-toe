

function  generateGameId() {
    return (new Date%9e6).toString(36)
}

module.exports = { generateGameId };