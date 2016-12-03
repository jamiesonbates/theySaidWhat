(function() {
  'use strict';

  let statements;
  let statementsGroup;
  const statementObjects = [];
  let answerSets = [];

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
      statements = statementsInclusive.filter((statement) => {
        return statement;
      })

      selectGroupOfQuotes(statements);
      createAnswerSets(statements);
    });
  };
  getStatements();

// Select 10 Random Quotes from statements Object
  const selectGroupOfQuotes = function(arrayOfObjects) {
    const statementsLength = statements.length;
    const statementsIndex = [];

    for (let i = 0; i < 10; i++) {
      statementsIndex.push(Math.floor(Math.random() * statementsLength));
    }

    statementsGroup = statements.filter((statement, index) => {
      if (statementsIndex.includes(index)) {
        return statement;
      }
    });
  }

// Put together Answer Sets
  const createAnswerSets = function(arrayOfObjects) {
    const allSpeakers = statements.map((statement) => {
      return statement.speaker.name;
    });

    const correctAnswerSpeakers = statementsGroup.map((statement) => {
      return statement.speaker.name;
    });

    answerSets = correctAnswerSpeakers.map((speaker) => {
      const unrandomized = [speaker];

      while (unrandomized.length < 4) {
        const randomSpeaker = Math.floor(Math.random() * allSpeakers.length);
        if (allSpeakers[randomSpeaker] !== speaker) {
          unrandomized.push(allSpeakers[randomSpeaker]);
        }
      }
    });
  }
})();
