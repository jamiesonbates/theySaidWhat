(function() {
  'use strict';

  const statementIDs = [];
  let statements;

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
      console.log(statements);
    });
  }
  getStatements();
})();
