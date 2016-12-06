(function() {
  'use strict';

// -----------------------------------------------------------------------------
//
//  Get Data and Create Object For Future Use
//
// -----------------------------------------------------------------------------
  let statementsObjSet;

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

      console.log(data);

      const parties = ['Republican', 'Democrat', 'Independent', 'Libertarian', 'Green'];

      const statementsInclusive = data.objects.map((statement) => {
        // console.log(statement.statement);

        if (parties.includes(statement.speaker.party.party) && statement.speaker.first_name !== '') {
          const statementObj = {
            quote: statement.statement,
            date: statement.statement_date,
            statement_url: `http://www.politifact.com${statement.canonical_url}`,
            ruling: statement.ruling.ruling,
            speaker: {
              name: `${statement.speaker.first_name} ${statement.speaker.last_name}`,
              position: statement.speaker.current_job,
              state: statement.speaker.home_state,
              party: statement.speaker.party.party,
              photoUrl: statement.speaker.photo
            }
          };

          return statementObj;
        }
      });

      const statements = statementsInclusive.filter((statement) => {
        return statement;
      });

      const statementsIndex = [];
      const statementsLength = statements.length;

      while (statementsIndex.length < 10) {
        const randomNumber = Math.floor(Math.random() * statementsLength);
        if (!statementsIndex.includes(randomNumber)) {
          statementsIndex.push(randomNumber);
        }
      };

      const statementsObjTempSet = statements.filter((statement, index) => {
        if (statementsIndex.includes(index)) {
          return statement;
        }
      });

      const allSpeakers = statements.map((statement) => {
        return statement.speaker; // .name
      });

      const answerSet = function(speaker, speakersGroup) {
        const unrandomized = [speaker];
        const randomizedIndex = [];
        const randomized = [];
        const taken = [];

        while (unrandomized.length < 4) {
          const randomI = Math.floor(Math.random() * speakersGroup.length);
          const proposed = speakersGroup[randomI];
          let takenBool = false;

          for (const speaker of taken) {
            if (speaker.name === proposed.name) {
              takenBool = true;
            }
          } // added to substituted using .includes()

          if (proposed.name !== speaker.name && !takenBool) { //add .name twice and add takenBool instead of .includes();
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
        statementsObj.answerSet = answerSet(statementsObj.speaker, allSpeakers); // .name

        let editedQuote = statementsObj.quote;
        editedQuote = editedQuote.replace('<p>','');
        editedQuote = editedQuote.replace('</p>','');
        editedQuote = editedQuote.replace('<div>','');
        editedQuote = editedQuote.replace('</div>','');
        editedQuote = editedQuote.replace(/(&quot;)/g, '"');
        editedQuote = editedQuote.replace(/(&rsquo;)/g, "'");
        editedQuote = editedQuote.replace(/(&#39;)/g, "'");
        // const re1 = new RegExp(/(<p>";<\/p>)/,'g');
        // editedQuote = editedQuote.replace(re1,'');
        // const re = /(<div dir="ltr">";)/g;
        // editedQuote = editedQuote.replace(re,'');
        editedQuote = editedQuote.replace('&nbsp;', ' ');
        editedQuote = editedQuote.replace('&hellip;',  '...');
        editedQuote = editedQuote.replace('&amp;', '&');
        editedQuote = editedQuote.replace('<br />', ' ');

        statementsObj.quote = `${editedQuote}`;
        // console.log(statementsObj.quote);

        return statementsObj;
      });

      // populate page with first quote
      $('#quote-text').text(statementsObjSet[0].quote);
      $('#answer-1').text(statementsObjSet[0].answerSet[0].name);
      $('#answer-2').text(statementsObjSet[0].answerSet[1].name);
      $('#answer-3').text(statementsObjSet[0].answerSet[2].name);
      $('#answer-4').text(statementsObjSet[0].answerSet[3].name);
    });
  };

  getStatements();

// -----------------------------------------------------------------------------
//
//  Render Data on Page and Add Functionality For Quiz
//
// -----------------------------------------------------------------------------
  let quoteCount = 0;

  const partOne = function($target) {
    const answer = $target.text();

    statementsObjSet[quoteCount].speakerGuess = answer;

    if (statementsObjSet[quoteCount].speakerGuess === statementsObjSet[quoteCount].speaker.name) {
      $('#result').text(`Correct! ${statementsObjSet[quoteCount].speaker.name} said this quote.`);
    };

    if (statementsObjSet[quoteCount].speakerGuess !== statementsObjSet[quoteCount].speaker.name) {
      $('#result').text(`Incorrect! ${statementsObjSet[quoteCount].speaker.name} said this quote.`);
    };

    // Change photo
    $('#photo').attr('src', statementsObjSet[quoteCount].speaker.photoUrl);

    // Show Politician Name
    $('#politician').text(statementsObjSet[quoteCount].speaker.name);

    $('#prompt h2').text('Do you know how truthful the statement was?');

    $('.p-choices').toggleClass('off');
    $('.tf-choices').toggleClass('off');
  };

  const partTwo = function($target) {
    const answer = $target.text();

    statementsObjSet[quoteCount].truthGuess = answer;

    if (statementsObjSet[quoteCount].truthGuess === statementsObjSet[quoteCount].ruling) {
      $('#ruling').text(`Correct! The statement is ${statementsObjSet[quoteCount].ruling}`);
    };

    if (statementsObjSet[quoteCount].truthGuess !== statementsObjSet[quoteCount].ruling) {
      $('#ruling').text(`Incorrect! The statement is actually ${statementsObjSet[quoteCount].ruling}`);
    };

    $('#prompt h2').text('Can you guess which politician said this?');

    $('.tf-choices').toggleClass('off');

    $('#submit').removeClass('off');
  };

  const nextQuestion = function() {
    $('#quote-text').text(statementsObjSet[quoteCount].quote);
    $('#answer-1').text(statementsObjSet[quoteCount].answerSet[0].name);
    $('#answer-2').text(statementsObjSet[quoteCount].answerSet[1].name);
    $('#answer-3').text(statementsObjSet[quoteCount].answerSet[2].name);
    $('#answer-4').text(statementsObjSet[quoteCount].answerSet[3].name);
    $('#politician').text('A politician said this.');
    $('#photo').attr('src', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Placeholder_no_text.svg/1024px-Placeholder_no_text.svg.png');
    $('#result').text('');
    $('#ruling').text('');
    $('#quote-count').text(`Quote ${quoteCount + 1} of 10`);
    $('#submit').addClass('off');
  };

  const buildResults = function() {
    for (const statement of statementsObjSet) {
      console.log(statement);
      const $tr = $('<tr>');

      const $tdName = $('<td>').text(statement.speaker.name);
      const $tdParty = $('<td>').text(statement.speaker.party);
      const $tdQuote = $('<td>').text(statement.quote);
      const $tdRuling = $('<td>').text(statement.ruling);
      const $tdSpeaker = $('<td>').text(statement.speakerGuess);
      const $tdTruth = $('<td>').text(statement.truthGuess);

      $tr.append($tdName);
      $tr.append($tdParty);
      $tr.append($tdQuote);
      $tr.append($tdRuling);
      $tr.append($tdSpeaker);
      $tr.append($tdTruth);

      $('tbody').append($tr);
    }
  }

  let stepOneComplete = false;
  let stepTwoComplete = false;

  $('.select').on('click', () => {
    const $target = $(event.target);

    if (!stepOneComplete && !stepTwoComplete) {
      partOne($target);
      stepOneComplete = true;
    }
    else if (stepOneComplete && !stepTwoComplete) {
      partTwo($target);
      stepTwoComplete = true;
      quoteCount += 1;
    }
    else if (stepOneComplete && stepTwoComplete && quoteCount < 10) {
      console.log('here');
      nextQuestion();
      stepOneComplete = false;
      stepTwoComplete = false;
      $('.p-choices').toggleClass('off');
    }
    else if (quoteCount === 10) {
      $('#quiz').addClass('off');
      $('#results').removeClass('off');
      buildResults();
    }
  });

  $('.more-info').on('click', (event) => {
    const $target = $(event.target);
    console.log($target.hasClass('answer-1'));
    const statement = statementsObjSet[quoteCount];
    if ($target.hasClass('answer-1')) {
      $('div .answer-1 .panel-photo').attr('src', statement.answerSet[0].photoUrl);
      $('div .answer-1 .info-party').text('Party: ' + statement.answerSet[0].party);
      $('div .answer-1 .info-position').text('Position: ' + statement.answerSet[0].position);
      $('div .answer-1 .info-state').text('State: ' + statement.answerSet[0].state);
      $('div.politician-panel.answer-1').toggleClass('off');
    }

    if ($target.hasClass('answer-2')) {
      $('div .answer-2 .panel-photo').attr('src', statement.answerSet[1].photoUrl);
      $('div .answer-2 .info-party').text('Party: ' + statement.answerSet[1].party);
      $('div .answer-2 .info-position').text('Position: ' + statement.answerSet[1].position);
      $('div .answer-2 .info-state').text('State: ' + statement.answerSet[1].state);
      $('div.politician-panel.answer-2').toggleClass('off');
    }

    if ($target.hasClass('answer-3')) {
      $('div .answer-3 .panel-photo').attr('src', statement.answerSet[2].photoUrl);
      $('div .answer-3 .info-party').text('Party: ' + statement.answerSet[2].party);
      $('div .answer-3 .info-position').text('Position: ' + statement.answerSet[2].position);
      $('div .answer-3 .info-state').text('State: ' + statement.answerSet[2].state);
      $('div.politician-panel.answer-3').toggleClass('off');
    }

    if ($target.hasClass('answer-4')) {
      $('div .answer-4 .panel-photo').attr('src', statement.answerSet[3].photoUrl);
      $('div .answer-4 .info-party').text('Party: ' + statement.answerSet[3].party);
      $('div .answer-4 .info-position').text('Position: ' + statement.answerSet[3].position);
      $('div .answer-4 .info-state').text('State: ' + statement.answerSet[3].state);
      $('div.politician-panel.answer-4').toggleClass('off');
    }
  });


})();
