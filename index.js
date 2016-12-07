(function() {
  'use strict';

// -----------------------------------------------------------------------------
//
//  Get Data and Create Object For Future Use
//
// -----------------------------------------------------------------------------
  let statementsObjSet;
  let allStatementsData = [];
  let allStatementsUrl = [];
  let dataSet;

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
      dataSet = data;
      organizeData();
    });
  };

  getStatements();

  const organizeData = function() {

    const parties = ['Republican', 'Democrat', 'Independent', 'Libertarian', 'Green'];

    const statementsInclusive = dataSet.objects.map((statement) => {

      if (parties.includes(statement.speaker.party.party) && statement.speaker.first_name !== '' && !allStatementsUrl.includes(`http://www.politifact.com${statement.canonical_url}`)) {
        const statementObj = {
          statement: {
            quote: (statement.statement).trim(),
            date: statement.statement_date,
            statementContext: statement.statement_context,
            statementUrl: `http://www.politifact.com${statement.canonical_url}`
          },
          ruling: {
            ruling: statement.ruling.ruling,
            rulingGraphic: statement.ruling.ruling_graphic,
            rulingSummary: statement.ruling_headline
          },
          speaker: {
            name: `${statement.speaker.first_name} ${statement.speaker.last_name}`,
            position: statement.speaker.current_job,
            state: statement.speaker.home_state,
            party: statement.speaker.party.party,
            photoUrl: statement.speaker.photo
          },
          user: {
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
      return statement.speaker;
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

      let editedQuote = statementsObj.statement.quote;

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

      statementsObj.statement.quote = `${editedQuote}`;

      return statementsObj;
    });

    // populate page with first quote
    $('#quote-text').text(statementsObjSet[0].statement.quote);
    $('#context').text(`Said in ${statementsObjSet[0].statement.statementContext}`);
    $('#answer-1').text(statementsObjSet[0].answerSet[0].name);
    $('#answer-2').text(statementsObjSet[0].answerSet[1].name);
    $('#answer-3').text(statementsObjSet[0].answerSet[2].name);
    $('#answer-4').text(statementsObjSet[0].answerSet[3].name);

    for (const statement of statementsObjSet) {
      allStatementsUrl.push(statement.statement.statementUrl);
      allStatementsData.push(statement);
    }
  }

// -----------------------------------------------------------------------------
//
//  Render Data on Page and Add Functionality For Quiz
//
// -----------------------------------------------------------------------------
  let quoteCount = 1;
  let setCount = 0;

  const partOne = function($target) {
    const answer = $target.text();
    const statement = statementsObjSet[setCount];

    statement.user.speakerGuess = answer;

    if (statement.user.speakerGuess === statement.speaker.name) {
      $('#result').text(`Correct! ${statement.speaker.name} said this quote.`);
    }

    if (statement.user.speakerGuess !== statement.speaker.name) {
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

    statementsObjSet[setCount].user.truthGuess = answer;

    if (statementsObjSet[setCount].user.truthGuess === statementsObjSet[setCount].ruling.ruling) {
      $('#ruling').text(`Correct! The statement is ${statementsObjSet[setCount].ruling.ruling}`);
    }

    if (statementsObjSet[setCount].user.truthGuess !== statementsObjSet[setCount].ruling.ruling) {
      $('#ruling').text(`Incorrect! The statement is actually ${statementsObjSet[setCount].ruling.ruling}`);
    }

    $('#prompt h2').text('');

    $('#truth-photo').removeClass('off');
    $('#truth-photo').attr('src', statementsObjSet[setCount].ruling.rulingGraphic);
    $('#summary-header').removeClass('off');
    $('#ruling-summary').text(statementsObjSet[setCount].ruling.rulingSummary);
    $('#source').removeClass('off');
    $('#source').attr('href', statementsObjSet[setCount].statement.statementUrl);

    $('.tf-choices').toggleClass('off');

    $('#submit').removeClass('off');

    if (setCount === 9) {
      $('#add-quotes').removeClass('off');
    }
  };

  const nextQuestion = function() {
    const statement = statementsObjSet[setCount];

    $('#quote-text').text(statement.statement.quote);
    $('#answer-1').text(statement.answerSet[0].name);
    $('#answer-2').text(statement.answerSet[1].name);
    $('#answer-3').text(statement.answerSet[2].name);
    $('#answer-4').text(statement.answerSet[3].name);
    $('#politician').text('A politician said this.');
    $('#photo').attr('src', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Placeholder_no_text.svg/1024px-Placeholder_no_text.svg.png');
    $('#result').text('');
    $('#ruling').text('');
    $('#quote-count').text(`Quote ${quoteCount} of ${allStatementsUrl.length}`);
    $('#submit').addClass('off');
    $('#prompt h2').text('Can you guess which politician said this?');
    $('#context').text(`Said in ${statement.statement.statementContext}.`);
    $('#truth-photo').addClass('off');
    $('#summary-header').addClass('off');
    $('#ruling-summary').addClass('off');
    $('#source').addClass('off');
    $('#position').text('');
    $('#party').text('');
    $('#state').text('');
    stepOneComplete = false;
    stepTwoComplete = false;
    $('.p-choices').toggleClass('off');
  };

  const buildResults = function() {
    let countQuotes = 1;

    for (const statement of allStatementsData) {
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
      const $quote = $('<p>').text('Statement: ' + statement.statement.quote);
      const $yourGuesses = $('<p>').text(`You thought ${statement.user.speakerGuess} said this and guessed that it was ${statement.user.truthGuess}.`);
      const $truth = $('<p>').text(`This statement was ${statement.ruling.ruling}`);

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
      setCount += 1;
      quoteCount += 1;
    }
    else if (stepOneComplete && stepTwoComplete && setCount < 10) {
      nextQuestion();
      if (setCount === 9) {
        $('#submit').text('See Results');
      }
    }
    else if (setCount === 10) {
      $('#quiz').addClass('off');
      $('#results').removeClass('off');
      buildResults();
    }
  });

  $('.more-info').on('click', (event) => {
    const $target = $(event.target);
    const stmt = statementsObjSet[setCount];

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

  $('#add-quotes').on('click', (event) => {
    organizeData();
    setCount = 0;
    nextQuestion();
    $('#submit').text('Next Question');
    $('#add-quotes').addClass('off');
  });
})();
