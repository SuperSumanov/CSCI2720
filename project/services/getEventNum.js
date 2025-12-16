const express = require('express');
const Event = require('../models/Event');
const Location = require('../models/Location');

async function getEventNum(locId){
    const events = await Event.countDocuments({ locId });
    return events;
    // try{
    //     const event=await Event.find({ locId: {$eq: locId }});
    //     return event.length;
    // } catch(err){
        
    // }
}

async function UpdateEventNumForLocations(){
    try{
        const locs=await Location.find({});
        for(let loc of locs){
            try{
                const cnt=await getEventNum(loc.id);
                const newLoc=await Location.findOneAndUpdate(
                { id: loc.id },
                { eventNum: cnt},
                { new: true }
                );
            } catch(err){
                
            }
        }
    } catch(err){
        
    }
}

module.exports = { UpdateEventNumForLocations };