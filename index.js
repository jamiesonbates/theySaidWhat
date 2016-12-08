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
    const answerSpeaker = $target.text();
    const statement = statementsObjSet[setCount];

    statement.user.speakerGuess = answerSpeaker;

    if (statement.user.speakerGuess === statement.speaker.name) {
      $('#result').text(`Correct! ${statement.speaker.name} said this quote.`);
      statement.user.speakerGuessCorrect = true;
    }

    if (statement.user.speakerGuess !== statement.speaker.name) {
      $('#result').text(`Incorrect! ${statement.speaker.name} said this quote.`);
      statement.user.speakerGuessCorrect = false;
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
    $('.extra-info').removeClass('off');
  };

  const partTwo = function($target) {
    const answerTruth = $target.text();
    const guessOptions = ['True', 'Mostly True', 'Half True', 'Mostly False', 'False', 'Pants on Fire'];

    statementsObjSet[setCount].user.truthGuess = answerTruth;

    if (statementsObjSet[setCount].user.truthGuess === statementsObjSet[setCount].ruling.ruling) {
      $('#ruling').text(`Correct! The statement is ${statementsObjSet[setCount].ruling.ruling}`);
      statementsObjSet[setCount].user.truthGuessCorrect = true;
    }

    if (statementsObjSet[setCount].user.truthGuess !== statementsObjSet[setCount].ruling.ruling) {
      $('#ruling').text(`Incorrect! The statement is actually ${statementsObjSet[setCount].ruling.ruling}`);
      statementsObjSet[setCount].user.truthGuessCorrect = false;
      const indexCorrect = guessOptions.indexOf(statementsObjSet[setCount].ruling.ruling);
      const indexGuess = guessOptions.indexOf(statementsObjSet[setCount].user.truthGuess);

      statementsObjSet[setCount].user.truthGuessDifference = Math.abs(indexCorrect - indexGuess);
    }

    $('#prompt').addClass('off');

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
    $('#prompt').removeClass('off');
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
    $('#question-results').addClass('off');
    $('#truth-question').addClass('off');
    $('#politician-question').addClass('off');
  };

  const countPoliticiansCorrect = function() {
    let correctCount = 0;

    for (const statement of allStatementsData) {
      if (statement.user.speakerGuessCorrect === true) {
        correctCount += 1;
      }
    }
    return correctCount;
  }

  const countTruthCorrect = function() {
    let correctCount = 0;

    for (const statement of allStatementsData) {
      if (statement.user.truthGuessCorrect === true) {
        correctCount += 1;
      }
    }
    return correctCount;
  }

  const countTruthClose = function() {
    let closeCount = 0;

    for (const statement of allStatementsData) {
      if (statement.user.truthGuessDifference === 1) {
        closeCount += 1;
      }
    }
    return closeCount;
  }

  const buildStageOne = function() {
    const divWidth = 100 / allStatementsData.length;
    const poliCorrect = countPoliticiansCorrect()
    const poliIncorrect = allStatementsData.length - countPoliticiansCorrect();
    const $politicianResults = $('#politician-results');
    const $poliD = $('<div>');
    $poliD.css('width', '100%');
    $poliD.css('height', '50%');
    const $poliP = $('<p>').text(`You guessed ${poliCorrect} of ${allStatementsData.length} correctly!`);
    $poliD.append($poliP);
    $politicianResults.append($poliD);

    const $divPoliColors = $('<div>');
    $divPoliColors.css('width', '100%');
    $divPoliColors.css('height', '50%');

    for (const statement of allStatementsData) {
      const $divPoliColor = $('<div>').css('display', 'inline-block');
      $divPoliColor.css('border-right', '1px solid white');
      $divPoliColor.css('width', (divWidth + '%'));
      $divPoliColor.css('height', '20px');

      if (statement.user.speakerGuessCorrect === true) {
        $divPoliColor.addClass('green-correct');
      }

      if (statement.user.speakerGuessCorrect === false) {
        $divPoliColor.addClass('red-incorrect');
      }
      $divPoliColors.append($divPoliColor);
    }
    $politicianResults.append($divPoliColors);

    const truthCorrect = countTruthCorrect();
    const truthClose = countTruthClose();
    const $truthResults = $('#truth-results');
    const $truthD = $('<div>');
    $truthD.css('width', '100%');
    $truthD.css('height', '50%');
    const $truthP = $('<p>').text(`You guessed ${truthCorrect} rulings correctly and were close on ${truthClose} more!`);
    $truthResults.append($truthP);
    $truthD.append($truthP);
    $truthResults.append($truthD);

    const $divTruthColors = $('<div>');
    $divTruthColors.css('width', '100%');
    $divTruthColors.css('height', '50%');

    for (const statement of allStatementsData) {
      const $divTruthColor = $('<div>').css('display', 'inline-block');
      $divTruthColor.css('border-right', '1px solid white')
      $divTruthColor.css('width', (divWidth + '%'));
      $divTruthColor.css('height', '20px');

      if (statement.user.truthGuessCorrect === true) {
        $divTruthColor.addClass('green-correct');
      }

      if (statement.user.truthGuessDifference === 1) {
        $divTruthColor.addClass('yellow-close');
      }

      if (statement.user.truthGuessDifference > 1) {
        $divTruthColor.addClass('red-incorrect');
      }
      $divTruthColors.append($divTruthColor);
    }
    $truthResults.append($divTruthColors);
  }

  const mostSeenPolitician = function() {
    const speakerArray = [];

    for (const statement of allStatementsData) {
      speakerArray.push(statement.speaker.name);
    }

    const currentHigh = [null, 0];

    const mostSeen = allStatementsData.filter((statement) => {
      let count = 0;

      for (const speaker of speakerArray) {
        if (speaker === statement.speaker.name) {
          count += 1;
        }
      }

      if (count > currentHigh[1]) {
        currentHigh[0] = statement;
        currentHigh[1] = count;
      }
    });
    return currentHigh[0];
  }

  const mostSeenResults = function(mostSeen) {
    const questionResults = allStatementsData.filter((statement, index) => {
      if (mostSeen.speaker.name === statement.speaker.name) {
        return statement;
      }
    });
    return questionResults;
  }

  const mostSuccessPolitician = function() {
    const speakerArray = [];
    const statementArray = [];

    for (const statement of allStatementsData) {
      statementArray.push(statement);
    }

    for (const statement of allStatementsData) {
      if (!speakerArray.includes(statement.speaker.name)) {
        speakerArray.push(statement.speaker.name);
      }
    }

    const speakerStatements = statementArray.reduce(function(acc, e){
      for(const speaker of speakerArray){
          if(e.speaker.name == speaker){
              if(acc.hasOwnProperty(speaker)){
                acc[speaker].count++;
                acc[speaker].stmt.push(e);
              }
              else {
                acc[speaker] = {};
                acc[speaker].count = 1;
                acc[speaker].stmt = [e];
              }
          }
      }
      return acc;
    }, {})

    return speakerStatements;
  } //has bug in it where statements are added twice (duplicates)

  const buildStageTwo = function() {
    const mostSeen = mostSeenPolitician();
    const questionResults = mostSeenResults(mostSeen);
    const divWidthSeen = 100 / questionResults.length;
    $('#most-photo').attr('src', mostSeen.speaker.photoUrl);
    $('#most-name').text(mostSeen.speaker.name);
    $('#most-party').text(mostSeen.speaker.party);
    const $mostSeenAnswers = $('#most-answers');

    const $mostSeenColors = $('<div>');
    $mostSeenColors.css('width', '100%');
    $mostSeenColors.css('height', '50%');

    for (const statement of questionResults) {
      const $mostSeenColor = $('<div>').css('display', 'inline-block');
      $mostSeenColor.css('border-right', '1px solid white');
      $mostSeenColor.css('width', (divWidthSeen + '%'));
      $mostSeenColor.css('height', '20px');

      if (statement.user.speakerGuessCorrect === true) {
        $mostSeenColor.addClass('green-correct');
      }

      if (statement.user.speakerGuessCorrect === false) {
        $mostSeenColor.addClass('red-incorrect');
      }
      $mostSeenColors.append($mostSeenColor);
    }
    $mostSeenAnswers.append($mostSeenColors);

    const seenCount = mostSuccessPolitician();
    console.log(seenCount);
    let highest = [null, 0];

    for (const politician in seenCount) {
      console.log(seenCount.politician);
      if (seenCount[politician].count > highest[1]) {
        highest[0] = seenCount[politician];
        highest[1] = seenCount[politician].count;
      }
    }

    console.log(highest);

    $('#success-photo').attr('src', highest[0].stmt[0].speaker.photoUrl);
    $('#success-name').text(highest[0].stmt[0].speaker.name);
    $('#success-party').text(highest[0].stmt[0].speaker.party);
    const divWidthSuccess = 100 / highest[0].stmt.length;
    const $mostSuccessAnswers = $('#most-success');

    const $mostSuccessColors = $('<div>');
    $mostSuccessColors.css('width', '100%');
    $mostSuccessColors.css('height', '50%');

    for (const statement of highest[0].stmt) {
      const $mostSuccessColor = $('<div>').css('display', 'inline-block');
      $mostSuccessColor.css('border-right', '1px solid white');
      $mostSuccessColor.css('width', (divWidthSuccess + '%'));
      $mostSuccessColor.css('height', '20px');

      if (statement.user.speakerGuessCorrect === true) {
        $mostSuccessColor.addClass('green-correct');
      }

      if (statement.user.speakerGuessCorrect === false) {
        $mostSuccessColor.addClass('red-incorrect');
      }
      $mostSuccessColors.append($mostSuccessColor);
    }
    $mostSuccessAnswers.append($mostSuccessColors);
  }

  const partyDifferences = function() {
    const democrats = [];
    const republicans = [];
    const thirdParties = [];

    for (const statement of allStatementsData) {
      if (statement.speaker.party === 'Democrat') {
        democrats.push(statement);
      }
      else if (statement.speaker.party === 'Republican') {
        republicans.push(statement);
      }
      else {
        thirdParties.push(statement);
      }
    }

    return [democrats,republicans,thirdParties];
  }

  const buildStageThree = function() {
    const partyDiffArray = partyDifferences();
    const dem = partyDiffArray[0];
    const divWidthDem = 100 / dem.length;
    const rep = partyDiffArray[1];
    const divWidthRep = 100 / rep.length;
    const third = partyDiffArray[2];
    const divWidthThird = 100 / third.length;

    const demCorrect = [];
    const demIncorrect = [];

    for (const statement of dem) {
      if (statement.user.speakerGuessCorrect === true) {
        demCorrect.push(statement);
      }
      else {
        demIncorrect.push(statement);
      }
    }

    const repCorrect = [];
    const repIncorrect = [];

    for (const statement of rep) {
      if (statement.user.speakerGuessCorrect === true) {
        repCorrect.push(statement);
      }
      else {
        repIncorrect.push(statement);
      }
    }

    const thirdCorrect = [];
    const thirdIncorrect = [];

    for (const statement of third) {
      if (statement.user.speakerGuessCorrect === true) {
        thirdCorrect.push(statement);
      }
      else {
        thirdIncorrect.push(statement);
      }
    }

    $('#party-intro-dem').text(`You guessed Democrats correctly ${demCorrect.length} times out of ${dem.length}`);
    const $demAnswers = $('#party-results-dem');
    const $demColors = $('<div>');
    $demColors.css('width', '100%');
    $demColors.css('height', '50%');

    for (const statement of dem) {
      const $demColor = $('<div>').css('display', 'inline-block');
      $demColor.css('border-right', '1px solid white');
      $demColor.css('width', (divWidthDem + '%'));
      $demColor.css('height', '20px');

      if (statement.user.speakerGuessCorrect === true) {
        $demColor.addClass('green-correct');
      }

      if (statement.user.speakerGuessCorrect === false) {
        $demColor.addClass('red-incorrect');
      }
      $demColors.append($demColor);
    }
    $demAnswers.append($demColors);

    $('#party-intro-rep').text(`You guessed Republicans correctly ${repCorrect.length} times out of ${rep.length}`);
    const $repAnswers = $('#party-results-rep');
    const $repColors = $('<div>');
    $repColors.css('width', '100%');
    $repColors.css('height', '50%');

    for (const statement of rep) {
      const $repColor = $('<div>').css('display', 'inline-block');
      $repColor.css('border-right', '1px solid white');
      $repColor.css('width', (divWidthRep + '%'));
      $repColor.css('height', '20px');

      if (statement.user.speakerGuessCorrect === true) {
        $repColor.addClass('green-correct');
      }

      if (statement.user.speakerGuessCorrect === false) {
        $repColor.addClass('red-incorrect');
      }
      $repColors.append($repColor);
    }
    $repAnswers.append($repColors);

    $('#party-intro-third').text(`You guessed Third Parties correctly ${thirdCorrect.length} times out of ${third.length}`);
    const $thirdAnswers = $('#party-results-third');
    const $thirdColors = $('<div>');
    $thirdColors.css('width', '100%');
    $thirdColors.css('height', '50%');

    for (const statement of third) {
      const $thirdColor = $('<div>').css('display', 'inline-block');
      $thirdColor.css('border-right', '1px solid white');
      $thirdColor.css('width', (divWidthThird + '%'));
      $thirdColor.css('height', '20px');

      if (statement.user.speakerGuessCorrect === true) {
        $thirdColor.addClass('green-correct');
      }

      if (statement.user.speakerGuessCorrect === false) {
        $thirdColor.addClass('red-incorrect');
      }
      $thirdColors.append($thirdColor);
    }
    $thirdAnswers.append($thirdColors);
  }

  const buildResultsAccordion = function() {
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
      renderPoliticianResults();
      stepOneComplete = true;

    }
    else if (stepOneComplete && !stepTwoComplete) {
      partTwo($target);
      renderTruthResults();
      stepTwoComplete = true;
      setCount += 1;
      updateGameStatus();
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
      buildResultsAccordion();
      buildStageOne();
      buildStageTwo();
      buildStageThree();
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
    updateGameStatus();
  });

  const updateGameStatus = function() {
    $('.status-bar').remove();
    const $status = $('#status');
    const width = 100 / allStatementsData.length;
    console.log(allStatementsData.length);
    console.log(quoteCount);

    for (let i = 0; i < quoteCount; i++) {
      const $div = $('<div>').css('display', 'inline-block');
      $div.css('width', width + '%');
      $div.css('height', '100%');
      $div.css('background-color', 'white');
      $div.css('border-right', '1px solid white');
      $div.addClass('status-bar');
      $status.append($div);
    }
  }

  const renderPoliticianResults = function() {
    const currentQuestion = allStatementsData[setCount];
    console.log(currentQuestion);

    $('#question-results').removeClass('off');
    $('#politician-question').removeClass('off');

    if (currentQuestion.user.speakerGuessCorrect === true) {
      $('#politician-result').text('Correct!');
      $('#politician-answer').text(`You correctly guessed "${currentQuestion.user.speakerGuess}!"`)
    }

    if (currentQuestion.user.speakerGuessCorrect === false) {
      $('#politician-result').text('Incorrect.')
      $('#politician-answer').text(`You incorrectly guessed "${currentQuestion.user.speakerGuess}."`);
    }
  }

  const renderTruthResults = function() {
    const currentQuestion = allStatementsData[setCount];
    console.log(currentQuestion);

    $('#truth-question').removeClass('off');

    if (currentQuestion.user.truthGuessCorrect === true) {
      $('#truth-result').text('Correct!');
      $('#truth-answer').text(`You correctly guessed "${currentQuestion.user.truthGuess}!"`);
    }

    if (currentQuestion.user.truthGuessDifference === 1) {
      $('#truth-result').text('Incorrect, but close!');
      $('#truth-answer').text(`You incorrectly guessed "${currentQuestion.user.truthGuess}," but you were within one!`);
    }

    if (currentQuestion.user.truthGuessDifference > 1) {
      $('#truth-result').text('Incorrect.');
      $('#truth-answer').text(`You incorrectly guessed "${currentQuestion.user.truthGuess}."`);
    }
  }
})();
