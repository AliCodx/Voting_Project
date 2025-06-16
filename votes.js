// Fetch and display all votes with images
function loadVotes() {
    fetch('http://localhost:3000/api/votes')
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#votesTable tbody');
            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No votes yet.</td></tr>';
            } else {
                data.forEach(row => {
                    const imgSrc = row.imagePath ? `http://localhost:3000/${row.imagePath.replace(/\\/g,'/')}` : '';
                    let statusColor = row.status === 'verified' ? '#28a745' : (row.status === 'rejected' ? '#dc3545' : '#ffc107');
                    let statusText = row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Pending';
                    tbody.innerHTML += `<tr style="background:${row.status === 'verified' ? '#eafbe7' : row.status === 'rejected' ? '#fdeaea' : '#fffbe7'};">
                        <td>${row.rollNo}</td>
                        <td>${row.candidate}</td>
                        <td>${imgSrc ? `<a href="${imgSrc}" target="_blank" title="Open Full Image"><img src="${imgSrc}" alt="Student Card" style="max-width:100px;max-height:80px;display:block;margin-bottom:5px;"></a><a href="${imgSrc}" download title="Download Image" style="display:inline-block;margin-top:2px;">Download</a>` : 'No Image'}</td>
                        <td>${row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</td>
                        <td><span style="color:${statusColor};font-weight:bold;">${statusText}</span></td>
                    </tr>`;
                });
            }
        })
        .catch(() => {
            const tbody = document.querySelector('#votesTable tbody');
            tbody.innerHTML = '<tr><td colspan="5" style="color:red;">Failed to load votes.</td></tr>';
        });
}

let votesInterval;
function startVotesPolling() {
    if (votesInterval) clearInterval(votesInterval);
    votesInterval = setInterval(() => {
        if (!document.hidden) loadVotes();
    }, 5000);
}
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) loadVotes();
});
document.addEventListener('DOMContentLoaded', function() {
    loadVotes();
    startVotesPolling();
});
document.getElementById('refreshBtn').addEventListener('click', loadVotes);
