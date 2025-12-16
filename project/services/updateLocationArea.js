const express = require('express');
const Location = require('../models/Location');

async function UpdateLocationArea(){
    const locIds=[3110031, 3110267, 3110565, 35510043, 35510044, 35511887, 35517396, 35517495, 36310304, 36310566];
    const areas=[78,144,100,156,90,135,135,100,285,135];
    for(let i=0;i<10;i++){
        const newLoc=await Location.findOneAndUpdate(
        { id: locIds[i] },
        { area: areas[i]},
        { new: true }
        );
    }
}

module.exports = { UpdateLocationArea };