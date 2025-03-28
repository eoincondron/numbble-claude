import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckIcon, RefreshCcw, Clock } from 'lucide-react';

const OPERATORS = ['+', '-', 'X', '%', '=', '^', '½'];

const OPERATOR_SCORES = {
  '+': 1,   // Addition
  '-': 1,   // Subtraction
  'X': 2,   // Multiplication
  '%': 2,   // Division
  '^': 3,   // Power
  '½': 3,   // Half
  '=': 0    // Equals (no extra points)
};

const ROUND_TIME_LIMIT = 60; // 60 seconds per round

const MathTilePuzzle = () => {
  const [board, setBoard] = useState([]);
  const [operatorTiles, setOperatorTiles] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [placedOperators, setPlacedOperators] = useState([]);
  const [placedParentheses, setPlacedParentheses] = useState([]);
  const [gameStatus, setGameStatus] = useState('');
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);

  // Initialize game
  const initializeGame = () => {
    // Generate 4-6 random single-digit numbers
    const newBoard = Array.from({ length: Math.floor(Math.random() * 3 + 4) },
        () => Math.floor(Math.random() * 9) + 1);

    // Create a pool of operator tiles
    const newOperatorTiles = [...OPERATORS, ...OPERATORS, ...OPERATORS];

    setBoard(newBoard);
    setOperatorTiles(newOperatorTiles);
    setSelectedTiles([]);
    setPlacedOperators([]);
    setPlacedParentheses([]);
    setGameStatus('');
    setTimeRemaining(ROUND_TIME_LIMIT);
    setTimerActive(true);
  };

  // Use effect to manage timer
  useEffect(() => {
    let timer;
    if (timerActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setTimerActive(false);
      setGameStatus('timeout');
    }

    return () => clearInterval(timer);
  }, [timerActive, timeRemaining]);

  // Use effect to initialize game on first render
  useEffect(() => {
    initializeGame();
  }, []);

  // Concatenate numbers
  const concatenateNumbers = (index) => {
    if (index < board.length - 1) {
      const newBoard = [...board];
      const concatenatedNumber = parseInt(`${newBoard[index]}${newBoard[index + 1]}`);

      // Remove the second number
      newBoard.splice(index + 1, 1);

      // Replace the first number with concatenated number
      newBoard[index] = concatenatedNumber;

      // Update board and adjust placed operators and parentheses
      setBoard(newBoard);

      // Remove the operator between concatenated numbers
      const newPlacedOperators = [...placedOperators];
      newPlacedOperators.splice(index, 1);
      setPlacedOperators(newPlacedOperators);

      // Remove any parentheses related to the removed number
      const newPlacedParentheses = placedParentheses.filter(
          p => p.index !== index + 1
      ).map(p => ({
        ...p,
        index: p.index > index + 1 ? p.index - 1 : p.index
      }));
      setPlacedParentheses(newPlacedParentheses);
    }
  };

  // Handle tile selection
  const handleTileSelect = (tile, isOperator) => {
    if (isOperator) {
      // If it's an operator tile
      if (operatorTiles.includes(tile)) {
        // Special handling for parentheses
        if (tile === '(' || tile === ')') {
          setSelectedTiles([...selectedTiles, tile]);
        } else {
          setSelectedTiles([...selectedTiles, tile]);
          setOperatorTiles(operatorTiles.filter(t => t !== tile));
        }
      }
    } else {
      // If it's a board number tile
      // Logic for number tile selection would go here if needed
    }
  };

  // Validate equation
  const validateEquation = () => {
    try {
      // Create equation string
      let equation = '';
      let parenthesesCount = 0;
      let equationScore = 0;

      // Build equation with numbers, operators, and parentheses
      board.forEach((num, index) => {
        // Add opening parentheses before number if specified
        const openParens = placedParentheses.filter(p => p.index === index && p.type === '(').length;
        equation += '('.repeat(openParens);

        // Add number
        equation += num;

        // Add closing parentheses after number if specified
        const closeParens = placedParentheses.filter(p => p.index === index && p.type === ')').length;
        equation += ')'.repeat(closeParens);

        // Add operator if not the last number
        if (index < board.length - 1) {
          const operator = placedOperators[index] || '+';
          equation += operator;

          // Calculate score for operators
          equationScore += OPERATOR_SCORES[operator] || 0;
        }
      });

      // Replace special operators
      const cleanedEquation = equation
          .replace(/X/g, '*')     // Multiplication
          .replace(/%/g, '/')     // Division
          .replace(/\^/g, '**')   // Power
          .replace(/½/g, '0.5');  // Half

      // Validate parentheses balance
      const openParenCount = (cleanedEquation.match(/\(/g) || []).length;
      const closeParenCount = (cleanedEquation.match(/\)/g) || []).length;

      if (openParenCount !== closeParenCount) {
        setGameStatus('invalid');
        return false;
      }

      // Evaluate the equation
      const result = eval(cleanedEquation);

      // Check if the result is a reasonable number
      if (!isNaN(result) &&
          result !== Infinity &&
          result !== -Infinity &&
          Math.abs(result) < 1000 &&
          Math.abs(result) > 0) {

        // Calculate time bonus
        const timeBonus = Math.floor(timeRemaining / 5);
        const totalScore = equationScore + timeBonus;

        setScore(prevScore => prevScore + totalScore);
        setGameStatus('success');
        setTimerActive(false);
        return true;
      } else {
        setGameStatus('invalid');
        return false;
      }
    } catch (error) {
      setGameStatus('invalid');
      return false;
    }
  };

  // Place operator between numbers
  const placeOperator = (index) => {
    if (selectedTiles.length > 0) {
      const tile = selectedTiles[0];

      // Handle parentheses placement
      if (tile === '(' || tile === ')') {
        const newPlacedParentheses = [
          ...placedParentheses,
          { index, type: tile }
        ];
        setPlacedParentheses(newPlacedParentheses);
        setSelectedTiles(selectedTiles.slice(1));
      } else {
        // Handle regular operators
        const newPlacedOperators = [...placedOperators];
        newPlacedOperators[index] = tile;

        setPlacedOperators(newPlacedOperators);
        setSelectedTiles(selectedTiles.slice(1));

        // Remove the operator from available tiles if not a special tile
        if (!['½', '^'].includes(tile)) {
          setOperatorTiles(operatorTiles.filter(t => t !== tile));
        }
      }
    }
  };

  return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-800">Math Tile Puzzle</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                <Clock className="mr-2 text-blue-600" />
                <span className={`text-xl font-semibold ${
                    timeRemaining <= 10 ? 'text-red-500' : 'text-blue-800'
                }`}>
                {timeRemaining}s
              </span>
              </div>
              <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
              <span className="text-xl font-semibold text-green-800">
                Score: {score}
              </span>
              </div>
            </div>
          </div>

          {/* Game Board */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex flex-col items-center space-y-2">
              {board.map((num, index) => (
                  <div key={index} className="flex items-center w-full justify-center space-x-2">
                    {/* Parentheses before number */}
                    {placedParentheses
                        .filter(p => p.index === index && p.type === '(')
                        .map((p, i) => (
                            <div key={i} className="text-2xl text-blue-600">(</div>
                        ))}

                    {/* Number */}
                    <div
                        className="w-16 h-16 flex items-center justify-center
                             bg-blue-500 text-white rounded-lg text-2xl font-bold shadow-md"
                    >
                      {num}
                    </div>

                    {/* Parentheses after number */}
                    {placedParentheses
                        .filter(p => p.index === index && p.type === ')')
                        .map((p, i) => (
                            <div key={i} className="text-2xl text-blue-600">)</div>
                        ))}

                    {/* Operator placement */}
                    {index < board.length - 1 && (
                        <div className="flex items-center space-x-2">
                          <div
                              className="w-12 h-12 flex items-center justify-center
                                 border-2 border-dashed border-blue-300 rounded-lg
                                 cursor-pointer hover:bg-blue-100 transition"
                              onClick={() => placeOperator(index)}
                          >
                            {placedOperators[index] || '+'}
                          </div>

                          {/* Number concatenation option */}
                          <div
                              className="w-8 h-8 flex items-center justify-center
                                 bg-blue-200 text-blue-700 rounded-full
                                 cursor-pointer hover:bg-blue-300 transition"
                              onClick={() => concatenateNumbers(index)}
                          >
                            ⥄
                          </div>
                        </div>
                    )}
                  </div>
              ))}
            </div>
          </div>

          {/* Operator Tiles */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {operatorTiles.map((tile, index) => (
                <button
                    key={index}
                    onClick={() => handleTileSelect(tile, true)}
                    className="bg-blue-500 text-white rounded-lg py-2
                         hover:bg-blue-600 focus:outline-none transition"
                >
                  {tile === '½' ? '1/2' : tile}
                </button>
            ))}
            {/* Parenthesis buttons */}
            <button
                onClick={() => handleTileSelect('(', true)}
                className="bg-green-500 text-white rounded-lg py-2
                       hover:bg-green-600 focus:outline-none transition"
            >
              (
            </button>
            <button
                onClick={() => handleTileSelect(')', true)}
                className="bg-green-500 text-white rounded-lg py-2
                       hover:bg-green-600 focus:outline-none transition"
            >
              )
            </button>
          </div>

          {/* Game Actions */}
          <div className="flex space-x-4">
            <button
                onClick={validateEquation}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg
                       hover:bg-green-600 flex items-center justify-center
                       space-x-2 transition"
                disabled={!timerActive}
            >
              <CheckIcon className="mr-2" /> Check Equation
            </button>
            <button
                onClick={initializeGame}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg
                       hover:bg-blue-600 flex items-center justify-center
                       space-x-2 transition"
            >
              <RefreshCcw className="mr-2" /> New Game
            </button>
          </div>

          {/* Game Status Feedback */}
          {gameStatus && (
              <div className={`mt-4 p-3 text-center rounded-lg font-semibold ${
                  gameStatus === 'success'
                      ? 'bg-green-100 text-green-800'
                      : gameStatus === 'timeout'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
              }`}>
                {gameStatus === 'success'
                    ? 'Congratulations! Valid equation created!'
                    : gameStatus === 'timeout'
                        ? 'Time is up! Start a new game.'
                        : 'Invalid equation. Try again!'}
              </div>
          )}
        </div>
      </div>
  );
};

export default MathTilePuzzle;