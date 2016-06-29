"use strict";

const loremIpsum = require('lorem-ipsum');

let generateContent = () => loremIpsum({
  count: 3                        // Number of words, sentences, or paragraphs to generate.
  , units: 'paragraphs'             // Generate words, sentences, or paragraphs.
  , sentenceLowerBound: 5           // Minimum words per sentence.
  , sentenceUpperBound: 10          // Maximum words per sentence.
  , paragraphLowerBound: 10         // Minimum sentences per paragraph.
  , paragraphUpperBound: 20         // Maximum sentences per paragraph.
  , format: 'plain'                 // Plain text or html
});

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkIfString(str) {
  return {
    contains: (subStr) => str.indexOf(subStr) > -1 ? true : false
  };
}

let extractFileName = str => str.match(/file:(.*?);/)[1].trim();
let extractBranchName = str => str.match(/branch:(.*?);/)[1].trim();


module.exports = {sleep, random, checkIfString, extractFileName, extractBranchName, generateContent};