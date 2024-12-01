const API_URL = 'https://api.coingecko.com/api/v3/coins/markets';
        const FETCH_INTERVAL = 60000;
        const MAX_COMPARISON = 5;
        let cryptoData = [];
        let preferences = JSON.parse(localStorage.getItem('preferences')) || {
            sortBy: 'name',
            darkMode: false,
            favorites: [],
        };
        let selectedCryptos = JSON.parse(localStorage.getItem('selectedCryptos')) || [];

        // Apply Preferences on Load
        document.getElementById('sort-option').value = preferences.sortBy;
        document.getElementById('dark-mode-toggle').checked = preferences.darkMode;
        if (preferences.darkMode) document.body.classList.add('dark-mode');

        // Update Preferences in Local Storage
        document.getElementById('sort-option').addEventListener('change', (event) => {
            preferences.sortBy = event.target.value;
            localStorage.setItem('preferences', JSON.stringify(preferences));
            fetchCryptoData(); // Refresh the data with new sort order
        });

        document.getElementById('dark-mode-toggle').addEventListener('change', (event) => {
            preferences.darkMode = event.target.checked;
            localStorage.setItem('preferences', JSON.stringify(preferences));
            document.body.classList.toggle('dark-mode', preferences.darkMode);
        });

        // Fetch cryptocurrency data
        async function fetchCryptoData() {
            try {
                const response = await fetch(`${API_URL}?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
                if (!response.ok) throw new Error('Failed to fetch data');
                cryptoData = await response.json(); // Store fetched data in global variable
                const sortedData = sortData(cryptoData, preferences.sortBy);
                updateTable(sortedData);
                updateFavoritesSection();
                updateComparisonSection(); // Refresh comparison section with updated data
            } catch (error) {
                console.error('Error fetching cryptocurrency data:', error);
                document.getElementById('crypto-table-body').innerHTML = `
                    <tr>
                        <td colspan="7">Failed to load data. Please try again later.</td>
                    </tr>`;
            }
        }

        // Sort data based on user preference
        function sortData(data, sortBy) {
            switch (sortBy) {
                case 'price':
                    return data.sort((a, b) => b.current_price - a.current_price);
                case 'marketCap':
                    return data.sort((a, b) => b.market_cap - a.market_cap);
                case 'change':
                    return data.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
                default:
                    return data.sort((a, b) => a.name.localeCompare(b.name));
            }
        }

        // Update the main table
        function updateTable(data) {
            const tableBody = document.getElementById('crypto-table-body');
            tableBody.innerHTML = '';
            data.forEach((crypto) => {
                const isFavorite = preferences.favorites.includes(crypto.id);
                const isSelected = selectedCryptos.includes(crypto.id);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${crypto.name}</td>
                    <td>${crypto.symbol.toUpperCase()}</td>
                    <td>$${crypto.current_price.toLocaleString()}</td>
                    <td style="color: ${crypto.price_change_percentage_24h >= 0 ? 'green' : 'red'};">
                        ${crypto.price_change_percentage_24h?.toFixed(2)}%
                    </td>
                    <td>$${crypto.market_cap.toLocaleString()}</td>
                    <td>
                        <button onclick="toggleFavorite('${crypto.id}')">
                            ${isFavorite ? 'Unfavorite' : 'Favorite'}
                        </button>
                    </td>
                    <td>
                        <button onclick="toggleComparison('${crypto.id}')">
                            ${isSelected ? 'Remove' : 'Add'}
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        // Update favorites section
        function updateFavoritesSection() {
            const favoritesList = document.getElementById('favorites-list');
            favoritesList.innerHTML = preferences.favorites.length === 0 
                ? '<p>No favorites yet.</p>'
                : preferences.favorites.join(', ');
        }

        // Toggle favorites
        function toggleFavorite(id) {
            const index = preferences.favorites.indexOf(id);
            if (index >= 0) {
                preferences.favorites.splice(index, 1);
            } else {
                preferences.favorites.push(id);
            }
            localStorage.setItem('preferences', JSON.stringify(preferences));
            updateFavoritesSection();
            fetchCryptoData(); // Refresh table to reflect favorite status
        }

        // Update comparison section
        function updateComparisonSection() {
            const comparisonList = document.getElementById('comparison-list');
            if (selectedCryptos.length === 0) {
                comparisonList.innerHTML = '<p>No cryptocurrencies selected for comparison.</p>';
                return;
            }

            const selectedData = cryptoData.filter((crypto) => selectedCryptos.includes(crypto.id));
            comparisonList.innerHTML = `
                <table border="1">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Current Price (USD)</th>
                            <th>24h Change (%)</th>
                            <th>Market Cap (USD)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedData
                            .map((crypto) => `
                                <tr>
                                    <td>${crypto.name}</td>
                                    <td>$${crypto.current_price.toLocaleString()}</td>
                                    <td style="color: ${crypto.price_change_percentage_24h >= 0 ? 'green' : 'red'};">
                                        ${crypto.price_change_percentage_24h?.toFixed(2)}%
                                    </td>
                                    <td>$${crypto.market_cap.toLocaleString()}</td>
                                    <td>
                                        <button onclick="removeFromComparison('${crypto.id}')">Remove</button>
                                    </td>
                                </tr>
                            `)
                            .join('')}
                    </tbody>
                </table>
            `;
        }

        // Remove cryptocurrency from comparison
        function removeFromComparison(id) {
            const index = selectedCryptos.indexOf(id);
            if (index >= 0) {
                selectedCryptos.splice(index, 1);
                localStorage.setItem('selectedCryptos', JSON.stringify(selectedCryptos));
                updateComparisonSection();
            }
        }

        // Add cryptocurrency to comparison
        function toggleComparison(id) {
            const index = selectedCryptos.indexOf(id);
            if (index >= 0) {
                selectedCryptos.splice(index, 1); // Remove if already selected
            } else if (selectedCryptos.length < MAX_COMPARISON) {
                selectedCryptos.push(id); // Add if under the limit
            } else {
                alert(`You can only compare up to ${MAX_COMPARISON} cryptocurrencies.`);
            }

            localStorage.setItem('selectedCryptos', JSON.stringify(selectedCryptos));
            updateComparisonSection();
        }

        // Initial Fetch and Interval
        fetchCryptoData();
        setInterval(fetchCryptoData, FETCH_INTERVAL);