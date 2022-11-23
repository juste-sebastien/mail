document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  // Listen compose-form submitting
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault();
    send_email();
    load_mailbox('sent');
    return false;
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  mailbox_name = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
 
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox_name}</h3>`;

  // Call the corresponding function to load mail
  get_mailbox_content(mailbox_name.toLowerCase());
}

function send_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        // Get email elements from request
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  // Parse response in to JSON
  .then(response => response.json())
  // Catch the error if one occurs
  .catch(error => {
    console.log('Error:', error);
  });
}

function get_mailbox_content(name) {
  fetch(`/emails/${name}`)
  .then(response => response.json())
  .then(emails => {
      console.log(emails);
      // For each email in the array
      emails.forEach(email => {
        const element = add_html_to_element(email);
        document.querySelector('#emails-view').append(element);
      });
  })
  // Catch the error if one occurs
  .catch(error => {
    console.log('Error:', error);
  });

}

function add_html_to_element(element) {
  // Create link
  const element_html = document.createElement('a');
  element_html.setAttribute('href', '#');
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

  // Add div to a tag and add eventListener
  element_html.appendChild(div);
  element_html.addEventListener('click', view_mail(element));
  console.log(element_html)
  return element_html
}

function view_mail(element) {
  // todo
}