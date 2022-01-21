document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send;

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


function send() {
  const re = document.querySelector('#compose-recipients').value;
  const sub = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: re,
        subject: sub,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });
  load_mailbox('sent');
  return false;
}


function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = '';
  
  // Show the mailbox name and load emails
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox[0].toUpperCase() + mailbox.slice(1)}</h3>`;
  document.querySelector('#emails-view').innerHTML += '<br>';
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      emails.forEach(email => load_emails(email, mailbox));
  });
}


function load_emails(email, mailbox) {
  // Creates email list container
  const emailContainer = document.createElement('li');
  emailContainer.className = 'list-group-item';
  document.querySelector('#emails-view').append(emailContainer);

  // Creates email card
  const emailCard = document.createElement('div');
  emailCard.className = 'row';
  emailCard.id = 'email';
  if (email.read === true && mailbox !== 'sent') {
    emailContainer.style.backgroundColor = 'lightgrey';
  }
  emailContainer.append(emailCard);

  // Creates email recipient
  const recipient = document.createElement('div');
  recipient.className = 'col';
  if (mailbox === 'sent') {
    recipient.innerHTML = email.recipients[0];
  }
  else {
    recipient.innerHTML = email.sender;
  }
  emailCard.append(recipient);

  // Creates email subject
  const subject = document.createElement('div');
  subject.className = 'col-6';
  subject.innerHTML = `<b>${email.subject}<b/>`;
  emailCard.append(subject);

  // Creates email timestamp
  const timestamp = document.createElement('div');
  timestamp.className = 'col';
  timestamp.innerHTML = email.timestamp;
  emailCard.append(timestamp);

  // Creates email archive button
  const archive = document.createElement('button');
  
  if (mailbox === 'archive') {
    archive.className = 'btn btn-outline-primary';
    archive.innerHTML = 'Unarchive';
    emailCard.append(archive);
  }
  else if (mailbox !== 'sent') {
    archive.className = 'btn btn-primary';
    archive.innerHTML = 'Archive';
    emailCard.append(archive);
  }
  
  archive.addEventListener('click', () => archived(email));
  recipient.addEventListener('click', () => email_view(email));
  subject.addEventListener('click', () => email_view(email));
  timestamp.addEventListener('click', () => email_view(email));
};


function email_view(email) {
  // Show the email view
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Turn email to read
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  
  // Email format
  document.querySelector('#emails-view').innerHTML = `<h3>${email.subject}</h3>`;

  const emailView = document.createElement('form');
  emailView.className = 'form-group';
  elements = emailView.elements;
  console.log(elements);
  document.querySelector('#emails-view').append(emailView);

  const from = document.createElement('input');
  from.className = 'form-control';
  from.value = `From: ${email.sender}`;
  from.disabled = true;
  emailView.append(from);

  const to = document.createElement('input');
  to.className = 'form-control';
  to.value = `To: ${email.recipients}`;
  to.disabled = true;
  emailView.append(to);

  const date = document.createElement('input');
  date.className = 'form-control';
  date.value = `Date: ${email.timestamp}`;
  date.disabled = true;
  emailView.append(date);

  const body = document.createElement('textarea');
  body.className = 'form-control';
  body.value = email.body;
  body.disabled = true;
  emailView.append(body);

  const reply = document.createElement('button');
  reply.className = 'btn btn-primary';
  reply.innerHTML = 'Reply';
  document.querySelector('#emails-view').append(reply);
  reply.addEventListener('click', () => reply_mail(email));
}


function reply_mail(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.indexOf('Re: ') === -1) {
    email.subject = `Re: ${email.subject}`;
  }
  document.querySelector('#compose-subject').value = email.subject;
  document.querySelector('#compose-body').value = `\n\n ---------------------------------------------------\n On ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;
}


function archived(email) {
  if (email.archived === true) {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
  }
  else {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
  }
  load_mailbox('inbox');
  location.reload();
}