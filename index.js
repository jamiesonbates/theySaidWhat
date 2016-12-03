(function() {
  'use strict';

  let statements;
  let statementsGroup;

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

      statements = data.objects.filter((statement) => {
        const parties = ['Republican','Democrat','Independent','Libertarian','Green']

        if (parties.includes(statement.speaker.party.party)) {
          const statementObj = {
            quote: statement.statement,
            date: statement.statement_date,
            url: `http://www.politifact.com${statement.canonical_url}`,
            ruling: statement.ruling.ruling,
            speaker: {
              name: `${statement.speaker.first_name} ${statement.speaker.last_name}`,
              party: statement.speaker.party.party,
              photo: statement.speaker.photo
            }
          }
        return statementObj;
        }
      });
      // console.log(statements);
      selectGroupOfQuotes(statements);
    });
  }
    getStatements();

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
    console.log(statementsGroup);
  }
})();
