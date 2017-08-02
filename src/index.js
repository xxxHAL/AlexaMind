'use strict';
var Alexa = require("alexa-sdk");
var appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';

/*
 * Sentence
 * Exception
 * emit(argument,argument)
 */

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'highLowGuessUsers';
    alexa.registerHandlers(newSessionHandlers, guessModeHandlers, startGameHandlers, guessAttemptHandlers);
    alexa.execute();
};

var states = {
    GUESSMODE: '_GUESSMODE', // User is trying to guess the number.
    STARTMODE: '_STARTMODE'  // Prompt the user to start or restart the game.
};

var newSessionHandlers = {
    'NewSession': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['endedSessionCount'] = 0;
            this.attributes['gamesPlayed'] = 0;
        }
        this.handler.state = states.STARTMODE;
        this.emit(':ask', 'Welcome to High Low guessing game. You have played '
            + this.attributes['gamesPlayed'].toString() + ' times. would you like to play?',
            'Say yes to start the game or no to quit.');
    },
    "AMAZON.StopIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        //this.attributes['endedSessionCount'] += 1;
        this.emit(":tell", "Goodbye!");
    }
};

var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        var message = 'I will think of a number between zero and one hundred, try to guess and I will tell you if it' +
            ' is higher or lower. Do you want to start the game?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function() {
        var digit_1 = Math.floor( Math.random() * 10 );
        do{ var digit_2 = Math.floor( Math.random() * 10 ); }while(digit_1 == digit_2)
        do{ var digit_3 = Math.floor( Math.random() * 10 ); }while(digit_1 == digit_3 || digit_2 == digit_3)
        /* this.attributes["guessNumber"] = 100 * digit_1 + 10 * digit_2 + digit_3; */
        this.attributes["guessDigit_1"] = digit_1;
        this.attributes["guessDigit_2"] = digit_2;
        this.attributes["guessDigit_3"] = digit_3;
        this.handler.state = states.GUESSMODE;
        this.emit(':ask', 'Great! ' + 'Try saying a number to start the game.', 'Try saying a number.');
    },
    'AMAZON.NoIntent': function() {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, see you next time!');
    },
    "AMAZON.StopIntent": function() {
      console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      console.log("CANCELINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        var message = 'Say yes to continue, or no to end the game.';
        this.emit(':ask', message, message);
    }
});

var guessModeHandlers = Alexa.CreateStateHandler(states.GUESSMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'NumberGuessIntent': function() {
        var eat = 0; var bite = 0;
        var guessNumber = parseInt(this.event.request.intent.slots.number.value);
        /*
         * invalid guessNumber check
         * guessNumber . int. !String.
         * {Error: exception handling}
         */
        var guessNumber_1 = guessNumber / 100;
        var guessNumber_2 = guessNumber % 100 / 10;
        var guessNumber_3 = guessNumber % 10;

        if((guessNumber_1 == guessNumber_2) || (guessNumber_2 == guessNumber_3) || (guessNumber_1 == guessNumber_3)){
            /* {Error: exception handling}
             * back parseInt(this.event.request...)
             */
            this.emit(':ask','Numerical value is a duplicate. Please say one more.')
        }

        var targetDigit_1 = this.attributes["guessDigit_1"];
        var targetDigit_2 = this.attributes["guessDigit_2"];
        var targetDigit_3 = this.attributes["guessDigit_3"];
        console.log('user guessed: ' + guessNumber);

        if(guessNumber_1 == targetDigit_1)eat++;
        if(guessNumber_2 == targetDigit_2)eat++;
        if(guessNumber_3 == targetDigit_3)eat++;

        if(guessNumber_1 == targetDigit_2 || guessNumber_1 == targetDigit_3)bite++;
        if(guessNumber_2 == targetDigit_1 || guessNumber_2 == targetDigit_3)bite++;
        if(guessNumber_3 == targetDigit_1 || guessNumber_3 == targetDigit_2)bite++;

        if(eat == 3){
            this.emit('JustRight', () => {
                this.emit(':ask', guessNumber_1.toString() + guessNumber_2.toString() +guessNumber_3.toString() + 'is correct! Would you like to play a new game?',
                'Say yes to start a new game, or no to end the game.');
            })
        }else if((eat > 0) && (bit == 0)){
            this.emit('OnlyEat',eat)
        }else if((bite > 0) && (eat == 0)){
            this.emit('OnlyBite',bite)
        }else if((eat == 0)&&(bite == 0)){
            this.emit('NoHit')
        }else{
            /* 
             * this.emit('Both',argument,argument)
             */
            this.emit('Both', eat, bite)
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I am thinking of a number between zero and one hundred, try to guess and I will tell you' +
            ' if it is higher or lower.', 'Try saying a number.');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
});

// These handlers are not bound to a state
var guessAttemptHandlers = {
    'OnlyEat': function(val) {
        this.emit(':ask', val.toString() + ' Eat.', 'Try saying a number.');
    },
    'OnlyBite': function(val) {
        this.emit(':ask', val.toString() + ' Bite.', 'Try saying a number.');
    },
    'JustRight': function(callback) {
        this.handler.state = states.STARTMODE;
        this.attributes['gamesPlayed']++;
        callback();
    },
    'NoHit': function() {
        this.emit(':ask', 'No Hit. Try saying a number.', 'Try saying a number.');
    },
    'Both': function(){
        /*
         *  .emit(argument, argument)
         */
        this.emit(':ask', val.toString() + ' Eat.' + val.toString() + 'Bite.', 'Try saying a number.');
    }
};