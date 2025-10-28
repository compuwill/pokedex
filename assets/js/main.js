/**
 * main.js
 * 
 * This file serves as the entry point for the application, initializing core modules and orchestrating the main workflow.
 */




// manual descriptions for certain pokemon for an escape room project
const pokemonDescriptions = {
    425: `<li>These Pokémon are called the "Signpost for Wandering Spirits."</li>
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

const pokemonNumber = getPokemonNumberFromUrl();
console.log('Pokedex Entry from URL:', pokemonNumber);

// Fetch Pokémon data from PokeAPI
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
                            // add the first type to verbiage
                            if (data.types.length > 0) {
                                verbiage += `a ${data.types[0].type.name} Pokémon. \n\n`;
                            }
                            verbiage += finalFlavorTexts.join('\n');
                            //store the verbiage in a data attribute for later use
                            document.getElementById('btn-description').dataset.verbiage = verbiage;

                            descriptionElem.innerHTML = `<ul>${finalFlavorTexts.map(text => `<li>${text}</li>`).join('')}</ul>`;

                        })
                        .catch(error => {
                            console.error('Error fetching Pokémon species data:', error);
                        });
                }

                // assign the button to play cry sound again or tapping the sprite
                const cryButton = document.getElementById('btn-battlecry');
                const descriptionButton = document.getElementById('btn-description');

                const playCry = () => {
                    console.log('Playing cry for', data.name);

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
                        //get cry url from data
                        const cryUrl = data.cries?.latest || data.cries?.legacy;
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
                    console.log('Playing description for', data.name);
                    if (pokemonVoiceDescriptions.includes(data.id)) {
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
                        window.currentVoiceAudio = new Audio(`assets/voice/${String(data.id).padStart(3, '0')}.wav`);
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
                    descriptionButton.addEventListener('click', playDescription);
                }
                if (cryButton) {
                    cryButton.addEventListener('click', playCry);
                }
                if (spriteImg) {
                    spriteImg.addEventListener('click', playCry);
                }

                //attempt to auto play the description after loading
                // setTimeout(() => {
                //     playDescription();
                // }, 1000);

            }
        })
        .catch(error => {
            console.error('Error fetching Pokémon data:', error);
        });
}


// if page loses focus, stop speech synthesis and audio playback
window.addEventListener('blur', () => {
    speechSynthesis.cancel();
    if (window.currentCryAudio && !window.currentCryAudio.paused) {
        window.currentCryAudio.pause();
    }
});


// if tap-to-scan is clicked, reveal pokemon info
document.getElementById('tap-to-scan').addEventListener('click', () => {
    document.getElementById('tap-to-scan').style.display = 'none';
    document.getElementById('pokemon-sprite').classList.add('reveal-sprite');
    //remove black-filter from pokemon-sprite after 0.25 seconds
    setTimeout(() => {
        document.getElementById('pokemon-sprite').classList.remove('black-filter');
        document.getElementById('pokemon-sprite').classList.remove('reveal-sprite');
    }, 250);

    setTimeout(() => {
        //perform click on btn-battlecry
        document.getElementById('btn-battlecry').click();
    }, 500);

    setTimeout(() => {
        //if the battlecry audio is still playing, wait until it's done
        const checkAndPlayDescription = () => {
            if (window.currentCryAudio && !window.currentCryAudio.paused) {
                window.currentCryAudio.onended = () => {
                    document.getElementById('btn-description').click();
                };
            } else {
                document.getElementById('btn-description').click();
            }
        };

        //perform click on btn-description
        checkAndPlayDescription();
    }, 1500);

});