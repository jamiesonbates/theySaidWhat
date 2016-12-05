(function() {
  'use strict';

  let statementsObjSet;

// Get Data and Create Object For Future Use
  const getStatements = function() {
    const $xhr = $.ajax({
      method: 'GET',
      url: 'https://cors-anywhere.herokuapp.com/http://www.politifact.com/api/v/2/statementlist/?limit=100&offset=0&format=json',
      dataType: 'json'
    });

    $xhr.done((data) => {
      if ($xhr.status !== 200) {
        return;
      }

      const parties = ['Republican','Democrat','Independent','Libertarian','Green']

      const statementsInclusive = data.objects.map((statement) => {
        if (parties.includes(statement.speaker.party.party) && statement.speaker.first_name !== '') {
          const statementObj = {
            quote: statement.statement,
            date: statement.statement_date,
            statement_url: `http://www.politifact.com${statement.canonical_url}`,
            ruling: statement.ruling.ruling,
            speaker: {
              name: `${statement.speaker.first_name} ${statement.speaker.last_name}`,
              party: statement.speaker.party.party,
              photo_url: statement.speaker.photo
            }
          };
          return statementObj;
        }
      });

      const statements = statementsInclusive.filter((statement) => {
        return statement;
      });

      const statementsObjTempSet = statements.filter((statement, index) => {
        const statementsLength = statements.length;
        const statementsIndex = [];

        for (let i = 0; i < 10; i++) {
          statementsIndex.push(Math.floor(Math.random() * statementsLength));
        }

        if (statementsIndex.includes(index)) {
          return statement;
        }
      });

      const allSpeakers = statements.map((statement) => {
        return statement.speaker.name;
      });

      const answerSet = function(speaker, speakersGroup) {
        const unrandomized = [speaker];
        const randomizedIndex = [];
        let randomized = [];
        const taken = [];

        while (unrandomized.length < 4) {
          const randomI = Math.floor(Math.random() * speakersGroup.length);
          const proposed = speakersGroup[randomI];
          if (proposed !== speaker && !taken.includes(proposed)) {
            unrandomized.push(proposed);
            taken.push(proposed);
          }
        }

        while (randomizedIndex.length < 4) {
          const randomSpeaker = Math.floor(Math.random() * unrandomized.length);
          if (!randomizedIndex.includes(randomSpeaker)) {
            randomizedIndex.push(randomSpeaker);
          }
        }

        for (let i = 0; i < 4; i++) {
          randomized[i] = unrandomized[randomizedIndex[i]];
        }
        return randomized;
      };

      statementsObjSet = statementsObjTempSet.map((statementsObj) => {
        statementsObj.answerSet = answerSet(statementsObj.speaker.name, allSpeakers);
        return statementsObj;
      });
      $('#quote-text').text(statementsObjSet[0].quote);
      $('#answer-1').text(statementsObjSet[0].answerSet[0]);
      $('#answer-2').text(statementsObjSet[0].answerSet[1]);
      $('#answer-3').text(statementsObjSet[0].answerSet[2]);
      $('#answer-4').text(statementsObjSet[0].answerSet[3]);
    });
  }

  getStatements();

  // Count Guesses of Politicians
  let speakerGuessCount = 0;

  $('.answer').on('click', (event) => {
    console.log('this works');

    // Check answer
    const answer = $('event.target').text();
    statementsObjSet.speakerGuess = answer;

    // Change photo
    $('#photo').attr('src', statementsObjSet[speakerGuessCount].speaker.photo_url);

    // Show Politician Name
    $('#politician').text(statementsObjSet[speakerGuessCount].speaker.name);

    speakerGuessCount++;
  });





})();
