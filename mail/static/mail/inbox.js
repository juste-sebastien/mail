document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  // Listen inner page buttons
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


/**
 * Display compose-view and undisplay emails-view
 */
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


/**
 * Use Django API to get email
 * @param {*} event
 */
 function send_email(event) {
  event.preventDefault()

  // POST email to API route
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        // Get email elements from request
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  // Load mailbox Sent
  .then(response => load_mailbox('sent'))
  // Catch the error if one occurs
  .catch(error => {
    console.log('Error:', error);
  });
}


/**
 * Get a specific email to render his page
 * @param {int} id 
 */
 function view_mail(id, mailbox) {

  // Get specific email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Show compose view and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-view').style.display = 'block'; 
      
      // Display email
      document.querySelector('#email-sender').innerHTML = `<em><b>From:</b></em> ${email.sender}`;
      document.querySelector('#email-recipients').innerHTML = `<em><b>To:</b></em> ${email.recipients}`;
      document.querySelector('#email-subject').innerHTML = `<em><b>Subject:</b></em> ${email.subject}`;
      document.querySelector('#email-timestamp').innerHTML = `${email.timestamp}`;
      document.querySelector('#email-body').innerHTML = `${email.body}`;

      // Get control panel
      const panelControl = document.querySelector('#email-panel');
      panelControl.className = 'btn-group';
      panelControl.innerHTML = '';
      
      if (mailbox != 'sent') {
        // Create reply button and add it to control panel
        const replyButton = document.createElement('button');
        replyButton.className = 'btn btn-sm btn-outline-primary';
        replyButton.innerHTML = 'Reply';
        replyButton.addEventListener('click', function() {
          reply(email);
        });
        panelControl.appendChild(replyButton);

        // Create archive button and add it to control panel
        const archiveButton = document.createElement('button');
        archiveButton.className = 'btn btn-sm btn-outline-primary';
        archiveButton.innerHTML = !email.archived ? 'Archive' : 'Unarchive';
        archiveButton.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived : !email.archived })
          })
          .then(response => load_mailbox('inbox'))
          .catch(error => {
            console.log('Error: ', error);
          });
        });
        panelControl.appendChild(archiveButton);

        // Create read button and add it to control panel
        readButton = document.createElement('button');
        readButton.className = 'btn btn-sm btn-outline-primary';
        readButton.innerHTML = email.read ? "Mark as Unread" : "Mark as Read";
        readButton.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({ read : false })
          })
          .then(response => load_mailbox('inbox'))
          .catch(error => {
            console.log('Error: ', error);
          });
        })
        panelControl.appendChild(readButton);
      }

      // Mark email as read
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({ read : true })
        })
      }
          
  })
  // Catch potential error
  .catch(error => {
    console.log('Error: ', error);
  });

}


/**
 * Load a specific mailbox with it name
 * @param {string} mailbox 
 */
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  const currentMailbox = document.querySelector('#emails-view');
  // Show the mailbox name
  mailbox_name = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  currentMailbox.innerHTML = `<h3>${mailbox_name}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Generate one div per mail
    emails.forEach(email => {
        // Create and stylise div
        let div = document.createElement('div');
        div.className = email.read ? 'd-flex align-items-center mb-2 bg-light rounded border border-secondary' : 'd-flex align-items-center mb-2 bg-secondary rounded border border-secondary';
        div.style.cursor = 'pointer';
        div.style.opacity = email.read ? '1' : '0.90';
        // Create title
        const title = document.createElement('h6');
        if (mailbox != 'sent') {
          title.textContent = `${email.sender}`;
        } else {
          title.textContent = `${email.recipients}`;
        }
        title.className = 'p-2';
        div.appendChild(title);
        // Create and add subject
        const subject = document.createElement('p');
        subject.textContent = `${email.subject}`;
        subject.className = 'ms-auto p-2 text-end';
        div.appendChild(subject);
        // Create and add timestamp
        const timestamp = document.createElement('p');
        timestamp.textContent = `${email.timestamp}`;
        timestamp.className = email.read ? 'p-2 text-muted' : 'p-2 text-white-50';
        div.appendChild(timestamp);

        // add listener and append to DOM
        div.addEventListener('click', function() {
          view_mail(email.id, mailbox);
        })
        currentMailbox.appendChild(div);
    })
  })
  // Catch potential error
  .catch(error => {
    console.log('Error: ', error);
  });
}


/**
 * Get compose form and populate fields with received mail content
 * @param {*} email 
 */
 function reply(email) {
  // Get compose form
  compose_email();

  // Populate form with mail content
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `\n\n\nOn ${email.timestamp} ${email.sender} wrote: \n\n ${email.body}`;
  
}
