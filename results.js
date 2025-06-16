// Fetch and display results from backend
function loadResults() {
    fetch('http://localhost:3000/api/votes')
        .then(res => res.json())
        .then(data => {
            const verifiedCounts = { Usman: 0, Ali: 0 };
            let rejectedCount = 0;
            data.forEach(row => {
                if (row.status === 'verified') {
                    if (row.candidate === 'Usman') verifiedCounts.Usman++;
                    if (row.candidate === 'Ali') verifiedCounts.Ali++;
                } else if (row.status === 'rejected') {
                    rejectedCount++;
                }
            });
            document.getElementById('usmanVotes').textContent = verifiedCounts.Usman;
            document.getElementById('aliVotes').textContent = verifiedCounts.Ali;
            document.getElementById('rejectedVotes').textContent = rejectedCount;

            // Show detailed table as before
            const tbody = document.querySelector('#resultsTable tbody');
            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No votes yet.</td></tr>';
            } else {
                data.forEach(row => {
                    if(row.status === 'rejected') {
                        const imgSrc = row.imagePath ? `http://localhost:3000/${row.imagePath.replace(/\\/g,'/')}` : '';
                        let statusColor = '#dc3545';
                        let statusText = 'Rejected';
                        tbody.innerHTML += `<tr style="background:#fdeaea;">
                            <td>${row.rollNo}</td>
                            <td>${row.candidate}</td>
                            <td>${imgSrc ? `<a href="${imgSrc}" target="_blank" title="Open Full Image"><img src="${imgSrc}" alt="Student Card" style="max-width:100px;max-height:80px;display:block;margin-bottom:5px;"></a><a href="${imgSrc}" download title="Download Image" style="display:inline-block;margin-top:2px;">Download</a>` : 'No Image'}</td>
                            <td>${row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</td>
                            <td><span style="color:${statusColor};font-weight:bold;">${statusText}</span></td>
                        </tr>`;
                    }
                });
            }
        })
        .catch(() => {
            document.getElementById('usmanVotes').textContent = '0';
            document.getElementById('aliVotes').textContent = '0';
            document.getElementById('rejectedVotes').textContent = '0';
            const tbody = document.querySelector('#resultsTable tbody');
            tbody.innerHTML = '<tr><td colspan="5" style="color:red;">Failed to load results.</td></tr>';
        });
}

let resultsInterval;
function startResultsPolling() {
    if (resultsInterval) clearInterval(resultsInterval);
    resultsInterval = setInterval(() => {
        if (!document.hidden) loadResults();
    }, 5000);
}
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) loadResults();
});
document.addEventListener('DOMContentLoaded', function() {
    loadResults();
    startResultsPolling();
});
document.getElementById('refreshBtn').addEventListener('click', loadResults);
