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
  fetch(`/emails/${name}`)
  .then(response => response.json())
  .then(emails => {
      // For each email in the array
      emails.forEach(email => {
        const element = add_html_to_element(email);
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => view_mail(email.id));
        document.querySelector('#emails-view').append(element);
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
  // Create title
  const title = document.createElement('h6');
  title.textContent = `${element.sender}`;
  div.appendChild(title);
  // Create and add subject
  const subject = document.createElement('p');
  subject.textContent = `${element.subject}`;
  div.appendChild(subject);
  // Create and add timestamp
  const timestamp = document.createElement('p');
  timestamp.textContent = `${element.timestamp}`;
  div.appendChild(timestamp);

  return div
}


/**
 * Get a specific email to render his page
 * @param {*} element 
 */
function view_mail(id) {

  // Get specific email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Show compose view and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-view').style.display = 'block'; 
      
      // Display email and mark as read
      markAsRead(email);
      displayEmail(email);
      
  })
  // Catch potential error
  .catch(error => {
    console.log('Error: ', error);
  });

}


/**
 * Complete email fields in inbox.html
 * @param {*} email 
 */
function displayEmail(email) {
  document.querySelector('#email-sender').innerHTML = `<em>From:</em> ${email.sender}`;
  document.querySelector('#email-recipients').innerHTML = `<em>To:</em> ${email.recipients}`;
  document.querySelector('#email-subject').innerHTML = `<em>Subject:</em> ${email.subject}`;
  document.querySelector('#email-timestamp').innerHTML = `${email.timestamp}`;
  document.querySelector('#email-body').innerHTML = `${email.body}`;
}


/**
 * Mark an email to read statement
 * @param {*} email
 */
function markAsRead(email) {
  fetch(`/emails/${email.id}` , {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
  
}