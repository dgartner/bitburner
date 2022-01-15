const FIRST_NAMES = ["Smith", "Sammy", "Terry", "Linda", "Jenni", "John", "Jake", "Jackson", "Andrew", "Tyler", "Kevin", "David", "Jessica", "Matthew", "Alyssa", "Juniper", "Kayla", "Ryan", "Stevie", "Evalyn", "Kris", "Noelle", "Susie", "Thomas"];   
const LAST_NAMES = ["Smithson", "Grover", "Stenn", "Brakken", "Sinner", "Farce", "Drummer", "Steward", "Seventhson", "Lyrre", "Trescent", "Canters", "Ik-thu", "Vorpal", "Barranor", "Storm", "Sky", "Winters", "Steel", "Carver"];

const FIRST_NAME_LENGTH = FIRST_NAMES.length;
const LAST_NAME_LENGTH = LAST_NAMES.length;

/** @param {NS} ns **/
export async function main(ns) 
{
    for (var i = 0; i < 10; i++)
        ns.tprint(i + ": " + generateName());
}

function generateName()
{
    var firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAME_LENGTH)];
    var lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAME_LENGTH)];

    var name = firstName + " " + lastName;
    return name;
}