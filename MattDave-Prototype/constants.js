export const home = "home";
export const HACKER_SCRIPT = "hack.js";
export const WEAKEN_SCRIPT = "weaken.js";
export const GROW_SCRIPT = "grow.js";

export const EXE_BRUTE_SSH = "BruteSSH.exe";
export const EXE_FTP_CRACK = "FTPCrack.exe";
export const EXE_HTTP_HACK = "HTTPWorm.exe";
export const EXE_SMTP_HACK = "relaySMTP.exe";
export const EXE_SQL_HACK = "SQLInject.exe";

export const AGENT_READY = "ready";
export const AGENT_HACK = "hacking";
export const AGENT_GROW = "growing";
export const AGENT_WEAK = "weaking";
export const AGENT_NOT_APPLICABLE = "N/A";

export const AGENT_STATUS_LIST = [AGENT_READY, AGENT_HACK, AGENT_GROW, AGENT_WEAK];
export const FIRST_NAMES = ["Smith", "Sammy", "Terry", "Linda", "Jenni", "John", "Jake", "Jackson", "Andrew", "Tyler", "Kevin", "David", "Jessica", "Matthew", "Alyssa", "Juniper", "Kayla", "Ryan", "Stevie", "Evalyn", "Kris", "Noelle", "Susie", "Thomas"];   
export const LAST_NAMES = ["Smithson", "Grover", "Stenn", "Brakken", "Sinner", "Farce", "Drummer", "Steward", "Seventhson", "Lyrre", "Trescent", "Canters", "Ik-thu", "Vorpal", "Barranor", "Storm", "Sky", "Winters", "Steel", "Carver"];

// TODO Minor optimization with hack scripts costing .05 less ram
export const AGENT_COST = 1.75;

export const FIRST_NAME_LENGTH = FIRST_NAMES.length;
export const LAST_NAME_LENGTH = LAST_NAMES.length;


export const ARMY_FIELD_REPORT_PORT = 1;
export const AGENT_DROPPOINT = 2;
export const NUM_THREADS = 1;

// TODO | currently 5 minutes
export const OPERATION_MAX_RUNTIME = 5 * 60 * 1000; 
export const OPERATION_HARD_STOP_RUNTIME_IN_MINUTES = 60