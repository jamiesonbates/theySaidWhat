(function() {
  'use strict';

  let statements;
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
        if (parties.includes(statement.speaker.party.party)) {
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
      answerSets(statements);
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
  const answerSets = function(arrayOfObjects) {
    const speakers = statements.map((statement) => {
      // console.log(statement);
      return statement.speaker.name;
    });
  }
})();
