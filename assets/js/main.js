/**
 * main.js
 * 
 * This file serves as the entry point for the application, initializing core modules and orchestrating the main workflow.
 */




// manual descriptions for certain pokemon for an escape room project
const pokemonDescriptions = {
    425: `<li>A Pokémon formed by the spirits of people and other Pokémon. It loves damp, humid places.</li>
          <li>Children holding them sometimes vanish.</li>
          <li>Stories go that it grabs the hands of small children and drags them away to the afterlife.</li>`,

};


// Pokedex entries (by National Dex number) that have custom voice descriptions:
// 1    - Bulbasaur
// 4    - Charmander
// 7    - Squirtle
// 39   - Jigglypuff
// 54   - Psyduck
// 83   - Farfetch'd
// 94   - Gengar
// 113  - Chansey
// 143  - Snorlax
// 355  - Duskull
// 425  - Drifloon
// 778  - Mimikyu
const pokemonVoiceDescriptions = [1, 4, 7, 39, 54, 83, 94, 113, 143, 355, 425, 778];

function getPokemonNumberFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const number = params.get('entry');
    return number ? parseInt(number, 10) : null;
}
let pokemonNumber = getPokemonNumberFromUrl();
console.log('Pokedex Entry from URL:', pokemonNumber);

//if no pokemon number in URL, and url has name parameter, try to fetch pokemon by name
if (!pokemonNumber) {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    if (name) {
        fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
            .then(response => response.json())
            .then(data => {
                pokemonNumber = data.id;
                console.log('Pokedex Entry from Name:', pokemonNumber);
                fetchPokemonData(pokemonNumber);
            });
    }
}

//if there is a hint parameter in the URL set the hint text
const params = new URLSearchParams(window.location.search);
const hintURL = params.get('hint');


// map of clue data audio files for their audio codes, and tap button text
const clueData = {
    'bathroom-ditto': {
        audioCode: 'bathroom-ditto',
        tapButtonText: 'Tap to Translate',
        transcript: `Ah—! "What... am I doing here?" I—I was just… uhh… reshaping! Yeah! Just… reshaping!! Heh… heheh…

Oh! Right! The—uh—floaty one! The balloon ghost thing?

It—uh—drifted that way! Toward a flickering light! For, um… warmth? Yeah.

And please forget you saw me here. Blorp…!`
    }
};

//if clue parameter is set
const clueURL = params.get('clue');
if (clueURL) {
    //load clue data
    const clue = clueData[clueURL];

    //change tap-to-scan text to clues tap text
    const tapToScan = document.getElementById('tap-to-scan');
    if (tapToScan) {
        tapToScan.textContent = clue.tapButtonText;
    }
}

// load seenClues from localStorage
let seenClues = JSON.parse(localStorage.getItem('seenClues')) || {};

let pokemonDataLoaded = false;
let totalPokemon = 1010; // as of current PokeAPI data

// declare audio variables
let cryUrl = '';
window.currentCryAudio = null;
window.currentVoiceAudio = null;

// Fetch Pokémon data from PokeAPI
function fetchPokemonData(pokemonNumber) {
    if (pokemonNumber) {
        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonNumber}`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched Pokémon Data:', data);

                const spriteUrl = data.sprites.front_default;
                const spriteImg = document.getElementById('pokemon-sprite');
                if (spriteImg && spriteUrl) {
                    spriteImg.src = spriteUrl;
                }

                //get cry url from data
                cryUrl = data.cries?.latest || data.cries?.legacy;

                const nameElem = document.getElementById('pokemon-name');
                if (nameElem) {
                    // get the species name and capitalize first letter
                    const speciesName = data.species.name;
                    nameElem.textContent = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
                }
                // display pokemon number and type(s)
                const numElem = document.getElementById('pokemon-number');
                if (numElem) {
                    numElem.textContent = `#${String(data.id).padStart(3, '0')}`;
                }
                const typeElem = document.getElementById('pokemon-type');
                if (typeElem) {
                    //for each type, create a bulma rounded tag element
                    typeElem.innerHTML = data.types.map(t => {
                        const typeColors = {
                            normal: "#A8A77A",
                            fire: "#EE8130",
                            water: "#6390F0",
                            electric: "#F7D02C",
                            grass: "#7AC74C",
                            ice: "#96D9D6",
                            fighting: "#C22E28",
                            poison: "#A33EA1",
                            ground: "#E2BF65",
                            flying: "#A98FF3",
                            psychic: "#F95587",
                            bug: "#A6B91A",
                            rock: "#B6A136",
                            ghost: "#735797",
                            dragon: "#6F35FC",
                            dark: "#705746",
                            steel: "#B7B7CE",
                            fairy: "#D685AD"
                        };
                        const color = typeColors[t.type.name] || "#888";
                        return `<span class="tag is-rounded py-0" style="background-color: ${color}; color: white;">${t.type.name.toUpperCase()}</span>`;

                    }).join('');
                }
                const descriptionElem = document.getElementById('pokemon-description');
                if (descriptionElem) {

                    //if the number is contained in pokemonDescriptions, use that description instead
                    if (pokemonDescriptions[data.id]) {
                        descriptionElem.innerHTML = `<ul>${pokemonDescriptions[data.id]}</ul>`;
                        pokemonDataLoaded = true;
                        showPokedexData();
                    } else {

                        // Fetch species data for description
                        fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonNumber}`)
                            .then(response => response.json())
                            .then(speciesData => {
                                console.log('Species Data:', speciesData);
                                descriptionElem.textContent = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en').flavor_text;
                                // Display the first four English flavor text entries as list items
                                const flavorTexts = speciesData.flavor_text_entries
                                    .filter(entry => entry.language.name === 'en')
                                    .map(entry => entry.flavor_text.replace(/\f/g, ' '))
                                    .slice(0, 10); // get first 10 entries

                                //iterate through and see if there are any that use 50% or more of the same words, if so, remove them
                                const uniqueFlavorTexts = [];
                                flavorTexts.forEach(text => {
                                    const isDuplicate = uniqueFlavorTexts.some(uniqueText => {
                                        const uniqueWords = uniqueText.split(' ');
                                        const totalWords = text.split(' ').length;
                                        const matchingWords = uniqueWords.filter(word => text.includes(word)).length;
                                        return (matchingWords / totalWords) >= 0.5;
                                    });
                                    if (!isDuplicate) {
                                        uniqueFlavorTexts.push(text.replace(/\n/g, ' '));
                                    }
                                });

                                //use only 3 unique flavor texts
                                const finalFlavorTexts = uniqueFlavorTexts.slice(0, 3);
                                let verbiage = `${nameElem.textContent}, `;
                                // add the types to verbiage
                                if (data.types.length > 0) {
                                    verbiage += `a ${data.types.map(type => type.type.name).join(' ')} Pokémon. \n\n`;
                                }
                                verbiage += finalFlavorTexts.join('\n');

                                //replace any uppercase species names with the proper pronunciation
                                const speciesName = data.species.name;
                                const capitalizedSpeciesName = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
                                const regex = new RegExp(`\\b${capitalizedSpeciesName.toUpperCase()}\\b`, 'g'); // word boundary to match whole words only
                                verbiage = verbiage.replace(regex, capitalizedSpeciesName.split('-').join(' '));

                                //store the verbiage in a data attribute for later use
                                document.getElementById('btn-description').dataset.verbiage = verbiage;

                                descriptionElem.innerHTML = `<ul>${finalFlavorTexts.map(text => `<li>${text}</li>`).join('')}</ul>`;

                                pokemonDataLoaded = true;
                                showPokedexData();
                            })
                            .catch(error => {
                                console.error('Error fetching Pokémon species data:', error);
                                document.getElementById('tap-to-scan').textContent = 'Scan Failed. Please try again.';
                            });
                    }


                }
            })
            .catch(error => {
                console.error('Error fetching Pokémon data:', error);
            });
    }
}

//run fetch on page load
fetchPokemonData(pokemonNumber);


// assign the button to play cry sound again or tapping the sprite
const cryButton = document.getElementById('btn-battlecry');
const descriptionButton = document.getElementById('btn-description');

const playCry = () => {
    let spriteImg = document.getElementById('pokemon-sprite');
    //stop if a description is being spoken
    speechSynthesis.cancel();

    if (window.currentCryAudio && !window.currentCryAudio.paused) {
        window.currentCryAudio.currentTime = 0;
        window.currentCryAudio.pause();
        return;
    }

    if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
        window.currentVoiceAudio.currentTime = 0;
        window.currentVoiceAudio.pause();
    }

    if (window.currentCryAudio && !window.currentCryAudio.paused) {
        window.currentCryAudio.currentTime = 0;
    } else {
        window.currentCryAudio = new Audio(cryUrl);
        window.currentCryAudio.play();
    }
    // make the pokemon sprite shake
    if (spriteImg) {
        spriteImg.classList.add('shake');
        setTimeout(() => {
            spriteImg.classList.remove('shake');
        }, 500);
    }
    speechSynthesis.cancel();
};

const playDescription = () => {

    if (pokemonVoiceDescriptions.includes(pokemonNumber)) {
        //if currentVoiceAudio is playing, stop it
        if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
            window.currentVoiceAudio.currentTime = 0;
            window.currentVoiceAudio.pause();
            return
        }

        if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
            window.currentVoiceAudio.pause();
            window.currentVoiceAudio.currentTime = 0;
        }
        window.currentVoiceAudio = new Audio(`assets/voice/${String(pokemonNumber).padStart(3, '0')}.wav`);
        window.currentVoiceAudio.play();
    }
    else {
        const utterance = new SpeechSynthesisUtterance(document.getElementById('btn-description').dataset.verbiage);

        if (navigator.userAgent.includes('Windows')) {
            utterance.rate = 2;
            utterance.pitch = 1.3;
        }
        else if (/iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream) {
            utterance.rate = 1;
            utterance.pitch = 1;
        }
        else {
            utterance.rate = 1.25;
            utterance.pitch = 1;
        }


        speechSynthesis.speak(utterance);
    }
};

if (descriptionButton) {
    //remove previous event listeners
    descriptionButton.removeEventListener('click', playDescription);
    descriptionButton.addEventListener('click', playDescription);
}
if (cryButton) {
    //remove previous event listeners
    cryButton.removeEventListener('click', playCry);
    cryButton.addEventListener('click', playCry);
}
if (document.getElementById('pokemon-sprite')) {
    //remove previous event listeners
    document.getElementById('pokemon-sprite').removeEventListener('click', playCry);
    document.getElementById('pokemon-sprite').addEventListener('click', playCry);
}


// if page loses focus, stop speech synthesis and audio playback
window.addEventListener('blur', () => {
    speechSynthesis.cancel();
    if (window.currentCryAudio && !window.currentCryAudio.paused) {
        window.currentCryAudio.pause();
    }
    if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
        window.currentVoiceAudio.pause();
    }
});


// if tap-to-scan is clicked, reveal pokemon info
document.getElementById('tap-to-scan').addEventListener('click', () => {
    if (!pokemonDataLoaded) {
        return;
    }

    document.getElementById('tap-to-scan').style.display = 'none';
    document.getElementById('pokemon-sprite').classList.remove('black-filter');

    setTimeout(() => {
        //perform click on btn-battlecry
        document.getElementById('btn-battlecry').click();
    }, 500);

    // ensure after the timeout, the current pokemon number is still the same
    let currentPokemonNumber = pokemonNumber;

    if (!clueURL) {
        setTimeout(() => {
            //if the battlecry audio is still playing, wait until it's done
            const waitUntilCryOver = () => {
                if (window.currentCryAudio && !window.currentCryAudio.paused) {
                    window.currentCryAudio.onended = () => {
                        if (currentPokemonNumber !== pokemonNumber) { return; }
                        document.getElementById('btn-description').click();
                    };
                } else {
                    if (currentPokemonNumber !== pokemonNumber) { return; }
                    document.getElementById('btn-description').click();
                }
            };

            //perform click on btn-description
            waitUntilCryOver();
        }, 1500);
    }
    else {

        //disable the btn-cry and btn-description buttons for 3 seconds
        document.getElementById('btn-battlecry').style.pointerEvents = 'none';
        document.getElementById('btn-description').style.pointerEvents = 'none';
        setTimeout(() => {
            document.getElementById('btn-battlecry').style.pointerEvents = 'auto';
            document.getElementById('btn-description').style.pointerEvents = 'auto';
        }, 3000);

        setTimeout(() => {
            //if the battlecry audio is still playing, wait until it's done
            const waitUntilCryOver = () => {
                if (window.currentCryAudio && !window.currentCryAudio.paused) {
                    window.currentCryAudio.onended = () => {
                        if (currentPokemonNumber !== pokemonNumber) { return; }
                        playClueAudio(clueURL);
                    };
                } else {
                    if (currentPokemonNumber !== pokemonNumber) { return; }
                    playClueAudio(clueURL);
                }
            };

            waitUntilCryOver();
        }, 1500);
    }

});

// if translation text is clicked, play translate audio again
document.getElementById('translation-text').addEventListener('click', () => {
    playClueAudio(clueURL);
});

function playClueAudio(clueCode) {
    //get clue object from clueData
    const clue = clueData[clueCode];

    console.log('Playing clue audio for:', clue);

    // stop speech synthesis and any current audio
    speechSynthesis.cancel();

    if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
        window.currentVoiceAudio.currentTime = 0;
        window.currentVoiceAudio.pause();
        return;
    }
    window.currentVoiceAudio = new Audio(`assets/clue/${clue.audioCode}.wav`);
    window.currentVoiceAudio.play();

    //show translation text if available
    const translationTextElem = document.getElementById('translation-text');
    if (translationTextElem && clue.transcript) {
        translationTextElem.textContent = `(${clue.transcript})`;
        translationTextElem.classList.remove('hidden');
    }

    //add a speaking animation to the pokemon sprite
    const spriteImg = document.getElementById('pokemon-sprite');
    if (spriteImg) {
        spriteImg.classList.add('speaking');

        //add clueCode to seenClues array if it doesn't exist and save to localStorage
        seenClues[clueCode] = true;
        localStorage.setItem('seenClues', JSON.stringify(seenClues));

        const removeSpeakingClass = () => {
            if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
                // Check again after 200ms
                setTimeout(removeSpeakingClass, 200);
            } else {
                spriteImg.classList.remove('speaking');
            }
        };
        setTimeout(removeSpeakingClass, 1000);
    }

    //disable the dpad buttons by adding the style pointer-events: none
    document.querySelectorAll('.dpad .up, .dpad .down, .dpad .left, .dpad .right').forEach(button => {
        button.style.pointerEvents = 'none';
    });
}

// if dpad buttons are clicked, play sound effect
document.querySelectorAll('.dpad .up, .dpad .down, .dpad .left, .dpad .right').forEach(button => {
    button.addEventListener('click', () => {
        const direction = button.classList[1]; // get the direction (up, down, left, right)
        playBeep()
    });
});

// play dpad click sound effect
function playBeep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(220, ctx.currentTime); // base click tone
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

//if dpad left is pressed, go to previous pokemon entry
document.querySelector('.dpad .left').addEventListener('click', () => {
    //stop any current audio or speech
    speechSynthesis.cancel();
    if (window.currentCryAudio && !window.currentCryAudio.paused) {
        window.currentCryAudio.pause();
    }
    if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
        window.currentVoiceAudio.pause();
    }


    if (pokemonNumber && pokemonNumber > 1) {
        hidePokedexData();
        //decrement pokemon number
        pokemonNumber -= 1;
        //fetch previous pokemon data
        fetchPokemonData(pokemonNumber);
        //update URL without reloading page
        window.history.pushState({}, '', `?entry=${pokemonNumber}`);


    }
});

//if dpad right is pressed, go to next pokemon entry
document.querySelector('.dpad .right').addEventListener('click', () => {
    //stop any current audio or speech
    speechSynthesis.cancel();
    if (window.currentCryAudio && !window.currentCryAudio.paused) {
        window.currentCryAudio.pause();
    }
    if (window.currentVoiceAudio && !window.currentVoiceAudio.paused) {
        window.currentVoiceAudio.pause();
    }

    if (pokemonNumber && pokemonNumber < totalPokemon) {
        hidePokedexData();
        //increment pokemon number
        pokemonNumber += 1;
        //fetch next pokemon data
        fetchPokemonData(pokemonNumber);
        //update URL without reloading page
        window.history.pushState({}, '', `?entry=${pokemonNumber}`);


    }
});

//if dpad up is pressed, scroll up screen-content
document.querySelector('.dpad .up').addEventListener('click', () => {
    const content = document.querySelector('.screen-content');
    content.scrollBy({
        top: -100,
        behavior: 'smooth'
    });
});

//if dpad down is pressed, scroll down screen-content
document.querySelector('.dpad .down').addEventListener('click', () => {
    const content = document.querySelector('.screen-content');
    content.scrollBy({
        top: 100,
        behavior: 'smooth'
    });
});

function hidePokedexData() {
    //black out current sprite
    const spriteImg = document.getElementById('pokemon-sprite');
    // spriteImg.classList.add('black-filter');
    //for each pokedex text element, add hidden class
    document.querySelectorAll('.pokedex-text').forEach(elem => {
        elem.classList.add('hidden');
    });
    //shrink sprite
    spriteImg.classList.add('shrink');
}

function showPokedexData() {
    const spriteImg = document.getElementById('pokemon-sprite');
    // spriteImg.classList.remove('black-filter');
    //for each pokedex text element, remove hidden class
    document.querySelectorAll('.pokedex-text').forEach(elem => {
        elem.classList.remove('hidden');
    });
    //remove shrink class if present
    if (spriteImg) { spriteImg.classList.remove('shrink'); }
}


//if btn-gray is pressed, play beep sound
document.getElementById('btn-gray').addEventListener('click', () => {
    playBeep();

    if (hintURL) {
        bulmaAlert('Hint', hintURL, 'is-danger');
    }

});

let redButtonPressCount = 0;

// if btn-red is pressed, play beep sound
document.getElementById('btn-red').addEventListener('click', () => {
    playBeep();

    redButtonPressCount += 1;
    setTimeout(() => {
        redButtonPressCount = 0;
    }, 2000);

    //if button pressed 5 times quickly, ask to clear seen clues
    if (redButtonPressCount >= 5) {
        bulmaConfirm('Clear Seen Clues', 'Are you sure you want to clear all seen clues? This action cannot be undone.', 'is-warning', () => {
            seenClues = {};
            localStorage.setItem('seenClues', JSON.stringify(seenClues));
        });
    }

});

let blueButtonPressCount = 0;

// if btn-blue is pressed, play beep sound
document.getElementById('btn-blue').addEventListener('click', () => {
    playBeep();

    blueButtonPressCount += 1;
    setTimeout(() => {
        blueButtonPressCount = 0;
    }, 2000);

    //if button pressed 5 times quickly, show seen clues
    if (blueButtonPressCount >= 5) {
        // show a bulma alert with all seen clues
        let seenClueList = '';
        for (const clueCode in seenClues) {
            seenClueList += `<li>${clueCode}</li>`;
        }
        bulmaAlert('Seen Clues', `<ul>${seenClueList}</ul>`, 'is-info');
    }
});


//if parameter hinton is set, show hint alert on page load
let hinton = params.get('hinton');
if (hinton == 'true' || hinton == '1') {
    bulmaAlert('Hint', hintURL, 'is-danger');
}