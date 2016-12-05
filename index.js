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

      const parties = ['Republican', 'Democrat', 'Independent', 'Libertarian', 'Green'];

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
        return statement.speaker.name;
      });

      const answerSet = function(speaker, speakersGroup) {
        const unrandomized = [speaker];
        const randomizedIndex = [];
        const randomized = [];
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

      // populate page with first quote
      $('#quote-text').text(statementsObjSet[0].quote);
      $('#answer-1').text(statementsObjSet[0].answerSet[0]);
      $('#answer-2').text(statementsObjSet[0].answerSet[1]);
      $('#answer-3').text(statementsObjSet[0].answerSet[2]);
      $('#answer-4').text(statementsObjSet[0].answerSet[3]);
    });
  };

  getStatements();

  let quoteCount = 0;
  let politicianSelected = false;
  let truthSelected = false;

  $('.politician-guess').on('click', (event) => {
    $('.selected').toggleClass('purple selected');
    $(event.target).toggleClass('purple selected');
    politicianSelected = !politicianSelected;
  });

  $('.truth-guess').on('click', (event) => {
    $('.selected').toggleClass('purple selected');
    $(event.target).toggleClass('purple selected');
    truthSelected = !truthSelected;
  });

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
    console.log(answer);
    console.log(statementsObjSet[quoteCount].ruling);

    statementsObjSet[quoteCount].truthGuess = answer;

    if (statementsObjSet[quoteCount].truthGuess === statementsObjSet[quoteCount].ruling) {
      $('#ruling').text(`Correct! The statement is ${statementsObjSet[quoteCount].ruling}`);
    };

    if (statementsObjSet[quoteCount].truthGuess !== statementsObjSet[quoteCount].ruling) {
      $('#ruling').text(`Incorrect! The statement is actually ${statementsObjSet[quoteCount].ruling}`);
    };

    $('#prompt h2').text('Can you guess which politician said this?');

    $('.tf-choices').toggleClass('off');
  };

  const nextQuestion = function() {
    $('#quote-text').text(statementsObjSet[quoteCount].quote);
    $('#answer-1').text(statementsObjSet[quoteCount].answerSet[0]);
    $('#answer-2').text(statementsObjSet[quoteCount].answerSet[1]);
    $('#answer-3').text(statementsObjSet[quoteCount].answerSet[2]);
    $('#answer-4').text(statementsObjSet[quoteCount].answerSet[3]);
    $('#politician').text('A politician said this.');
    $('#photo').attr('src', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Placeholder_no_text.svg/1024px-Placeholder_no_text.svg.png');
    $('#result').text('');
    $('#ruling').text('');
    $('#quote-count').text(`Quote ${quoteCount + 1} of 10`);
    $('#submit p').text('Submit');
  };

  let stepOneComplete = false;
  let stepTwoComplete = false;

  $('#submit').on('click', () => {
    const $target = $('.selected');

    if (!stepOneComplete && !stepTwoComplete) {
      if (!politicianSelected) {
        return;
      }
      partOne($target);
      stepOneComplete = true;
    }
    else if (stepOneComplete && !stepTwoComplete) {
      if (!truthSelected) {
        return;
      }
      partTwo($target);
      stepTwoComplete = true;
      quoteCount += 1;
      $('#submit p').text('Next Question');
    }
    else if (stepOneComplete && stepTwoComplete) {
      nextQuestion();
      stepOneComplete = false;
      stepTwoComplete = false;
      politicianSelected = !politicianSelected;
      truthSelected = !truthSelected;
      $('.p-choices').toggleClass('off');
    }

    $('.selected').toggleClass('purple selected');
  });

})();
