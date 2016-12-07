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
      url: 'https://cors-anywhere.herokuapp.com/http://www.politifact.com/api/v/2/statementlist/?limit=200&offset=0 &format=json',
      dataType: 'json'
    });

    $xhr.done((data) => {
      if ($xhr.status !== 200) {
        return;
      }

      const parties = ['Republican', 'Democrat', 'Independent', 'Libertarian', 'Green'];

      const statementsInclusive = data.objects.map((statement) => {

        if (parties.includes(statement.speaker.party.party) && statement.speaker.first_name !== '') {
          const statementObj = {
            quote: (statement.statement).trim(),
            date: statement.statement_date,
            statementContext: statement.statement_context,
            statementUrl: `http://www.politifact.com${statement.canonical_url}`,
            ruling: statement.ruling.ruling,
            rulingGraphic: statement.ruling.ruling_graphic,
            rulingSummary: statement.ruling_headline,
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
      }

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

          for (const speakerObj of taken) {
            if (speakerObj.name === proposed.name) {
              takenBool = true;
            }
          }

          if (proposed.name !== speaker.name && !takenBool) {
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
        statementsObj.answerSet = answerSet(statementsObj.speaker, allSpeakers);

        let editedQuote = statementsObj.quote;

        editedQuote = editedQuote.replace('<p>', '');
        editedQuote = editedQuote.replace('</p>', '');
        editedQuote = editedQuote.replace('<div>', '');
        editedQuote = editedQuote.replace('<div>', '');
        editedQuote = editedQuote.replace('</div>', '');
        editedQuote = editedQuote.replace(/(&quot;)/g, '"');
        editedQuote = editedQuote.replace(/(&rsquo;)/g, "'");
        editedQuote = editedQuote.replace(/(&#39;)/g, "'");
        editedQuote = editedQuote.replace(/(<div dir="ltr">)/g, '');
        editedQuote = editedQuote.replace(/(&nbsp;<\/div>)/g, '');
        editedQuote = editedQuote.replace(/(<p> <\/p>)/g, '');
        editedQuote = editedQuote.replace(/(<p>&nbsp;<\/p>)/g, '');
        editedQuote = editedQuote.replace('&nbsp;', ' ');
        editedQuote = editedQuote.replace('&hellip;', '...');
        editedQuote = editedQuote.replace('&amp;', '&');
        editedQuote = editedQuote.replace('<br />', ' ');

        statementsObj.quote = `${editedQuote}`;

        return statementsObj;
      });

      // populate page with first quote
      $('#quote-text').text(statementsObjSet[0].quote);
      $('#context').text(`Said in ${statementsObjSet[0].statementContext}`);
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
    const statement = statementsObjSet[quoteCount];

    statement.speakerGuess = answer;

    if (statement.speakerGuess === statement.speaker.name) {
      $('#result').text(`Correct! ${statement.speaker.name} said this quote.`);
    }

    if (statement.speakerGuess !== statement.speaker.name) {
      $('#result').text(`Incorrect! ${statement.speaker.name} said this quote.`);
    }

    // Change photo
    $('#photo').attr('src', statement.speaker.photoUrl);

    // Show Politician Name
    $('#politician').text(statement.speaker.name);

    $('#position').text(statement.speaker.position);

    $('#party').text(statement.speaker.party);

    $('#state').text(statement.speaker.state);

    $('#prompt h2').text('Do you know how truthful the statement was?');

    $('.p-choices').toggleClass('off');
    $('.tf-choices').toggleClass('off');

    $('div.politician-panel').addClass('off');
  };

  const partTwo = function($target) {
    const answer = $target.text();

    statementsObjSet[quoteCount].truthGuess = answer;

    if (statementsObjSet[quoteCount].truthGuess === statementsObjSet[quoteCount].ruling) {
      $('#ruling').text(`Correct! The statement is ${statementsObjSet[quoteCount].ruling}`);
    }

    if (statementsObjSet[quoteCount].truthGuess !== statementsObjSet[quoteCount].ruling) {
      $('#ruling').text(`Incorrect! The statement is actually ${statementsObjSet[quoteCount].ruling}`);
    }

    $('#prompt h2').text('');

    $('#truth-photo').removeClass('off');
    $('#truth-photo').attr('src', statementsObjSet[quoteCount].rulingGraphic);
    $('#summary-header').removeClass('off');
    $('#ruling-summary').text(statementsObjSet[quoteCount].rulingSummary);
    $('#source').removeClass('off');
    $('#source').attr('href', statementsObjSet[quoteCount].statementUrl);

    $('.tf-choices').toggleClass('off');

    $('#submit').removeClass('off');
  };

  const nextQuestion = function() {
    const statement = statementsObjSet[quoteCount];

    $('#quote-text').text(statement.quote);
    $('#answer-1').text(statement.answerSet[0].name);
    $('#answer-2').text(statement.answerSet[1].name);
    $('#answer-3').text(statement.answerSet[2].name);
    $('#answer-4').text(statement.answerSet[3].name);
    $('#politician').text('A politician said this.');
    $('#photo').attr('src', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Placeholder_no_text.svg/1024px-Placeholder_no_text.svg.png');
    $('#result').text('');
    $('#ruling').text('');
    $('#quote-count').text(`Quote ${quoteCount + 1} of 10`);
    $('#submit').addClass('off');
    $('#prompt h2').text('Can you guess which politician said this?');
    $('#context').text(`Said in ${statement.statementContext}.`);
    $('#truth-photo').addClass('off');
    $('#summary-header').addClass('off');
    $('#ruling-summary').addClass('off');
    $('#source').addClass('off');
    $('#position').text('');
    $('#party').text('');
    $('#state').text('');
  };

  const buildResults = function() {
    let countQuotes = 1;
    for (const statement of statementsObjSet) {
      const $ul = $('.results-list');
      const $li = $('<li>');
      const $divI = $('<div>').addClass('collapsible-header');
      const $icon = $('<i>').addClass('material-icons');
      $icon.text('add')
      $divI.text(`Quote ${countQuotes} - ${statement.speaker.name}`);
      $divI.append($icon);
      const $divP = $('<div>').addClass('collapsible-body');
      const $divHead = $('<div>').addClass('results');
      const $photo = $('<img>').attr('src', statement.speaker.photoUrl);
      const $speaker = $('<p>').text(`${statement.speaker.name} is a  ${statement.speaker.party} and ${statement.speaker.position}.`);
      const $quote = $('<p>').text('Statement: ' + statement.quote);
      const $yourGuesses = $('<p>').text(`You thought ${statement.speakerGuess} said this and guessed that it was ${statement.truthGuess}.`);
      const $truth = $('<p>').text(`This statement was ${statement.ruling}`);

      $li.append($divI);
      $divHead.append($photo);
      $divHead.append($speaker);
      $divP.append($divHead);
      $divP.append($quote);
      $divP.append($yourGuesses);
      $divP.append($truth);
      $li.append($divP);
      $ul.append($li);

      countQuotes += 1;
    }
  };

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
    const stmt = statementsObjSet[quoteCount];

    if ($target.hasClass('answer-1')) {
      $('div .answer-1 .panel-photo').attr('src', stmt.answerSet[0].photoUrl);
      $('div .answer-1 .info-party').text('Party: ' + stmt.answerSet[0].party);
      $('div .answer-1 .info-position').text('Position: ' + stmt.answerSet[0].position);
      $('div .answer-1 .info-state').text('State: ' + stmt.answerSet[0].state);
      $('div.politician-panel.answer-1').toggleClass('off');
    }

    if ($target.hasClass('answer-2')) {
      $('div .answer-2 .panel-photo').attr('src', stmt.answerSet[1].photoUrl);
      $('div .answer-2 .info-party').text('Party: ' + stmt.answerSet[1].party);
      $('div .answer-2 .info-position').text('Position: ' + stmt.answerSet[1].position);
      $('div .answer-2 .info-state').text('State: ' + stmt.answerSet[1].state);
      $('div.politician-panel.answer-2').toggleClass('off');
    }

    if ($target.hasClass('answer-3')) {
      $('div .answer-3 .panel-photo').attr('src', stmt.answerSet[2].photoUrl);
      $('div .answer-3 .info-party').text('Party: ' + stmt.answerSet[2].party);
      $('div .answer-3 .info-position').text('Position: ' + stmt.answerSet[2].position);
      $('div .answer-3 .info-state').text('State: ' + stmt.answerSet[2].state);
      $('div.politician-panel.answer-3').toggleClass('off');
    }

    if ($target.hasClass('answer-4')) {
      $('div .answer-4 .panel-photo').attr('src', stmt.answerSet[3].photoUrl);
      $('div .answer-4 .info-party').text('Party: ' + stmt.answerSet[3].party);
      $('div .answer-4 .info-position').text('Position: ' + stmt.answerSet[3].position);
      $('div .answer-4 .info-state').text('State: ' + stmt.answerSet[3].state);
      $('div.politician-panel.answer-4').toggleClass('off');
    }
  });
})();
