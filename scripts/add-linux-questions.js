#!/usr/bin/env node

// Script to add Linux+ questions to the database
const questions = [
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141443_2j8i9ez6x_0', // System Management
    questionText: 'Which command is used to display the current kernel version in Linux?',
    questionType: 'multiple-choice',
    options: ['uname -r', 'kernel --version', 'version -k', 'linux -v'],
    correctAnswer: [0],
    explanation: 'The uname -r command displays the release version of the current kernel. The -r flag specifically shows the kernel release information.',
    difficulty: 1,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141443_2j8i9ez6x_0', // System Management
    questionText: 'What is the purpose of the /etc/fstab file?',
    questionType: 'multiple-choice',
    options: [
      'It contains user account information',
      'It defines filesystems to be mounted at boot time',
      'It stores network configuration',
      'It manages system services'
    ],
    correctAnswer: [1],
    explanation: 'The /etc/fstab file contains information about filesystems that should be mounted automatically at boot time, including mount points, filesystem types, and mount options.',
    difficulty: 2,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141498_kh4vnljo4_1', // Security
    questionText: 'Which of the following commands can be used to change file permissions? (Choose all that apply)',
    questionType: 'multiple-answer',
    options: ['chmod', 'chown', 'chgrp', 'umask'],
    correctAnswer: [0, 3],
    explanation: 'Both chmod and umask can be used to change file permissions. chmod changes permissions directly, while umask sets default permissions for newly created files. chown changes ownership and chgrp changes group ownership.',
    difficulty: 2,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141552_u6s4ugda8_2', // Scripting
    questionText: 'In a bash script, which variable contains the number of arguments passed to the script?',
    questionType: 'multiple-choice',
    options: ['$#', '$?', '$@', '$*'],
    correctAnswer: [0],
    explanation: '$# contains the number of positional parameters (arguments) passed to the script. $? contains the exit status of the last command, while $@ and $* contain all arguments.',
    difficulty: 2,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141605_hbhe7k80c_3', // Troubleshooting
    questionText: 'Which command would you use to check disk usage by directory?',
    questionType: 'multiple-choice',
    options: ['df -h', 'du -sh *', 'ls -la', 'fdisk -l'],
    correctAnswer: [1],
    explanation: 'The du -sh * command displays disk usage for each directory in human-readable format. df shows filesystem usage, ls lists files, and fdisk manages partitions.',
    difficulty: 1,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141443_2j8i9ez6x_0', // System Management
    questionText: 'Which systemd command is used to enable a service to start at boot?',
    questionType: 'multiple-choice',
    options: [
      'systemctl start service-name',
      'systemctl enable service-name',
      'systemctl activate service-name',
      'systemctl boot service-name'
    ],
    correctAnswer: [1],
    explanation: 'systemctl enable creates symbolic links to enable a service to start automatically at boot. systemctl start only starts the service immediately without enabling it for boot.',
    difficulty: 2,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141498_kh4vnljo4_1', // Security
    questionText: 'What is the purpose of SELinux?',
    questionType: 'multiple-choice',
    options: [
      'To provide mandatory access control',
      'To encrypt network traffic',
      'To manage user passwords',
      'To monitor system performance'
    ],
    correctAnswer: [0],
    explanation: 'SELinux (Security-Enhanced Linux) provides mandatory access control (MAC) that goes beyond traditional discretionary access control (DAC) to provide additional security layers.',
    difficulty: 3,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141552_u6s4ugda8_2', // Scripting
    questionText: 'Which Docker command is used to list all running containers?',
    questionType: 'multiple-choice',
    options: [
      'docker ps',
      'docker list',
      'docker containers',
      'docker show'
    ],
    correctAnswer: [0],
    explanation: 'docker ps lists running containers. Add -a flag to see all containers including stopped ones. The other commands are not valid Docker commands.',
    difficulty: 1,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141605_hbhe7k80c_3', // Troubleshooting
    questionText: 'Which log file would you check first for system-wide error messages?',
    questionType: 'multiple-choice',
    options: [
      '/var/log/messages or /var/log/syslog',
      '/var/log/auth.log',
      '/var/log/kern.log',
      '/var/log/boot.log'
    ],
    correctAnswer: [0],
    explanation: '/var/log/messages (Red Hat-based) or /var/log/syslog (Debian-based) contain general system messages and are the first place to check for system-wide issues.',
    difficulty: 2,
    isActive: true
  },
  {
    examId: 'exm_1752676141404_bmxpdlbcn',
    objectiveId: 'obj_1752676141443_2j8i9ez6x_0', // System Management
    questionText: 'Which command displays real-time system resource usage including CPU, memory, and processes?',
    questionType: 'multiple-choice',
    options: ['top', 'ps', 'free', 'uptime'],
    correctAnswer: [0],
    explanation: 'The top command provides a real-time, dynamic view of system processes and resource usage. ps shows a snapshot, free shows memory, and uptime shows system load.',
    difficulty: 1,
    isActive: true
  }
];

async function addQuestions() {
  try {
    console.log('Adding Linux+ questions to database...');
    
    for (const question of questions) {
      const response = await fetch('http://localhost:3002/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(question)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to add question: ${error}`);
      } else {
        const result = await response.json();
        console.log(`Added question: ${question.questionText.substring(0, 50)}...`);
      }
    }
    
    console.log('Successfully added all questions!');
  } catch (error) {
    console.error('Error adding questions:', error);
  }
}

// Check if server is running
fetch('http://localhost:3002/api/health')
  .then(() => {
    console.log('Server is running, proceeding to add questions...');
    addQuestions();
  })
  .catch(() => {
    console.error('Server is not running. Please start the development server first with: npm run dev');
  });