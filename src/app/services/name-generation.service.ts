import {Injectable} from '@angular/core';

const LOBBY_ADJECTIVES = [
    'amber', 'azure', 'brave', 'calm', 'dark', 'deep', 'elder', 'ember',
    'feral', 'frost', 'grand', 'grim', 'hollow', 'iron', 'jade', 'keen',
    'lone', 'misty', 'noble', 'obsidian', 'pale', 'quiet', 'rapid', 'silent',
    'stark', 'swift', 'thorn', 'twilight', 'vast', 'wild',
];

const LOBBY_NOUNS = [
    'arc', 'bastion', 'comet', 'dawn', 'drift', 'dusk', 'echo', 'ember',
    'flare', 'forge', 'frontier', 'gate', 'haven', 'isle', 'light', 'moon',
    'nebula', 'nexus', 'peak', 'realm', 'rift', 'ring', 'rise', 'shore',
    'shard', 'sky', 'star', 'tide', 'vale', 'void',
];

const USER_TITLES = [
    'The ',
    'The Argent ',
    'The Barony of ',
    'The Clan of ',
    'The Council ',
    'The Crimson ',
    'The Deepwrought ',
    'The Emirates of ',
    'The Embers of ',
    'The Federation of ',
    'The Ghosts of ',
    'The L1Z1X ',
    'The Mahact ',
    'The Mentak ',
    'The Naalu ',
    'The Naaz-Rokha ',
    'The Nekro ',
    'The Ral Nel ',
    'The Titans of ',
    'The Universities of ',
    'The Vuil\'Raith ',
    'The Xxcha ',
    'The Yin ',
    'The Tribes of ',
    'Last ',
    'Sardakk ',
];

const USER_NOUNS = [
    'Alliance',
    'Arborec',
    'Bastion',
    'Brotherhood',
    'Cabal',
    'Coalition',
    'Collective',
    'Consortium',
    'Creuss',
    'Empyrean',
    'Firmament',
    'Flight',
    'Gene Sorcerers',
    'Hacan',
    'Jol-Nar',
    'Keleres',
    'Kingdom',
    'Letnev',
    'Mindnet',
    'Muaat',
    'N\'orr',
    'Nomad',
    'Obsidian',
    'Rebellion',
    'Saar',
    'Scholarate',
    'Sol',
    'Yssaril',
    'Ul',
    'Virus',
    'Winnu',
    'Xxcha',
];

@Injectable({providedIn: 'root'})
export class NameGenerationService {

    /** Generate a unique-ish lobby code in the form "adj-noun-NNN". */
    generateLobbyCode(): string {
        const adj = LOBBY_ADJECTIVES[Math.floor(Math.random() * LOBBY_ADJECTIVES.length)];
        const noun = LOBBY_NOUNS[Math.floor(Math.random() * LOBBY_NOUNS.length)];
        const num = Math.floor(Math.random() * 900) + 100; // 100-999
        return `${adj}-${noun}-${num}`;
    }

    /** Get or generate a persistent random username stored in localStorage. */
    getOrCreateUsername(): string {
        let name = localStorage.getItem('twilight_username');
        if (!name) {
            name = this.generateUsername();
            localStorage.setItem('twilight_username', name);
        }
        return name;
    }

    /** Generate and persist a brand-new random username, replacing any existing one. */
    rerollUsername(): string {
        const name = this.generateUsername();
        localStorage.setItem('twilight_username', name);
        return name;
    }

    /** Generate a random username without persisting it. */
    generateUsername(): string {
        const title = USER_TITLES[Math.floor(Math.random() * USER_TITLES.length)];
        const noun = USER_NOUNS[Math.floor(Math.random() * USER_NOUNS.length)];
        return `${title}${noun}`;
    }
}

