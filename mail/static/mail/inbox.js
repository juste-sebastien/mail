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


/**
 * Load a specific mailbox with it name
 * @param {string} mailbox 
 */
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  mailbox_name = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
 
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox_name}</h3>`;

  // Call the corresponding function to load mail
  get_mailbox_content(mailbox_name.toLowerCase());
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
 * Take a specific mailbox to render emails content
 * in it
 * @param {string} name 
 */
function get_mailbox_content(name) {
  // Get emails in a specific mailbox into an array
  let container = document.querySelector('#emails-view');
  container.innerHTML = '';
  fetch(`/emails/${name}`)
  .then(response => response.json())
  .then(emails => {
      // For each email in the array
      emails.forEach(email => {
        const element = add_html_to_element(email);
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => view_mail(email.id, name));
        container.append(element);
      });
  })
  // Catch the error if one occurs
  .catch(error => {
    console.log('Error:', error);
  });

}


/**
 * Take an email from a list and generate html to id
 * @param {object} element
 * @return {object} div
 */
function add_html_to_element(element) {
  //Create container
  const div = document.createElement('div');
  div.className = element.read ? 'd-flex align-items-center mb-2 bg-light rounded border border-secondary' : 'd-flex align-items-center mb-2 bg-primary rounded border border-primary';
  // Create title
  const title = document.createElement('h6');
  title.textContent = `${element.sender}`;
  title.className = 'p-2';
  div.appendChild(title);
  // Create and add subject
  const subject = document.createElement('p');
  subject.textContent = `${element.subject}`;
  subject.className = 'ms-auto p-2';
  div.appendChild(subject);
  // Create and add timestamp
  const timestamp = document.createElement('p');
  timestamp.textContent = `${element.timestamp}`;
  timestamp.className = 'p-2';
  div.appendChild(timestamp);

  return div
}


/**
 * Get a specific email to render his page
 * @param {int} id 
 * @param {string} mailbox
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
      markAsRead(email, true);
      displayEmail(email, mailbox);
      
  })
  // Catch potential error
  .catch(error => {
    console.log('Error: ', error);
  });

}


/**
 * Complete email fields in inbox.html
 * @param {*} email
 * @param {string} mailbox 
 */
function displayEmail(email, mailbox) {
  document.querySelector('#email-sender').innerHTML = `<em><b>From:</b></em> ${email.sender}`;
  document.querySelector('#email-recipients').innerHTML = `<em><b>To:</b></em> ${email.recipients}`;
  document.querySelector('#email-subject').innerHTML = `<em><b>Subject:</b></em> ${email.subject}`;
  document.querySelector('#email-timestamp').innerHTML = `${email.timestamp}`;
  document.querySelector('#email-panel').replaceWith(displayPanel(email, mailbox));
  document.querySelector('#email-body').innerHTML = `${email.body}`;
}


/**
 * Display control panel of an email
 * @param {*} email 
 * @param {string} mailbox
 */
function displayPanel(email, mailbox) {
  // Get panel control and remove his children
  let panelControl = document.querySelector('#email-panel');
  
  // Add Event on Reply Button
  let replyButton = document.querySelector('#email-panel-reply');
  replyButton.addEventListener('click', function() {
    reply(email);
  });

  // Display Archive Button and Read Button
  if (mailbox != 'sent') {
    panelControl.className = 'btn-group';
    let archiveButton = document.querySelector('#email-panel-archive');
    archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive';
    let readButton = document.querySelector('#email-panel-read');
    readButton.textContent = email.read ? 'Mark as Unread' : 'Mark as Read';
    archiveButton.addEventListener('click', function () {
      // Send new status on db
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          archived : !email.archived,
          read: false 
        })
      })
      // Redirect to inbox
      .then(response => load_mailbox('inbox'));
    });
    readButton.addEventListener('click', function() {
      // Send new status on db
      statement = email.read ? false : true;
      markAsRead(email, statement);
      // Redirect to inbox
      load_mailbox('inbox');
    });

    panelControl.appendChild(replyButton);
    panelControl.appendChild(archiveButton);
    panelControl.appendChild(readButton);
  } else {
    panelControl.className = 'd-none';
  }

  return panelControl
  
}

function markAsRead(email, statement = false) {
  fetch(`/emails/${email.id}` , {
    method: 'PUT',
    body: JSON.stringify({
        read: statement
    })
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}
