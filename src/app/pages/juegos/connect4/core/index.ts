//========================= INDEX ===========================================
//archivo barrel de core
//reexporta engine, bot, session y helpers
//permite que el componente connect4.ts importe todo desde ./core
//====================================================================

export * from './engine/connect4-engine';
export * from './engine/connect4-bot';
export * from './logic/connect4-helpers';
export * from './session/connect4-session';
