remove QueryClientProvider and related hooks usePlayerState and useTierState.
leave only AdminScreen and DefaultScreen, remove PrepareScreen and QuestionScreen.
clean navigation/index.tsx of unused routes.
on AdminScreen remove seat option and remove it from AppContext.
on Default screen at the top show quizState.tierLegend and quizState.state from useWebSocketContext. Use headerContainer and headerText style from QuestionScreen for it.
Under the header on Default screen show list of answers from useWebSocket. List contains only answer where answer.isCorrect === false. Background of item destructive color from scheme. Item in the list contain next information: item.correctAnswer, item.answer. 
implement dummy callback for item swipe gesture to the right (NO) and to the left (YES). Give user a tip about this functionality.
leave ConnectionStatus component at the bottom of the Default screen