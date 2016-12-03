(function() {
  'use strict';

  let statementsGroup;
  const statementObjects = [];

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

      // selectGroupOfQuotes(statements);
      const statementsObjSet = statements.filter((statement, index) => {
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

      const statementObjSet2 = statementsObjSet.map((statementsObj) => {
        statementsObj.answerSet = answerSet(statementsObj.speaker.name, allSpeakers);
        return statementsObj;
      });
      console.log(statementObjSet2);
    });
  }
  getStatements();

// Select 10 Random Quotes from statements Object

// Put together Answer Sets



})();
