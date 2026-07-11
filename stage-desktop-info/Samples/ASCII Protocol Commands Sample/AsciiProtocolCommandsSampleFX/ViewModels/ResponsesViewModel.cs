//-----------------------------------------------------------------------
// <copyright file="ResponsesViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Collections.ObjectModel;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using Entities;
    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.ViewModels;

    /// <summary>
    /// View model to display responess from the reader
    /// </summary>
    public class ResponsesViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// The response settings
        /// </summary>
        private IObservableResponseSettings responseSettings;

        /// <summary>
        /// Initializes a new instance of the ResponsesViewModel class
        /// </summary>
        /// <param name="messages">Reports the Message event when a message should be added to the user interface</param>
        /// <param name="displayResponder">Reports the ReceivedLine event when a response line is received from the reader</param>
        public ResponsesViewModel(Services.MessageService messages, TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder displayResponder)
        {
            if (messages == null)            
            {
                throw new ArgumentNullException("messages");
            }

            if (displayResponder == null)
            {
                throw new ArgumentNullException("displayResponder");
            }

            this.responseSettings = new ResponseSettingsAdapter();
            this.responseSettings.PropertyChanged += this.ResponseSettings_PropertyChanged;

            this.Messages = new ObservableCollection<string>();
            this.Responses = new ObservableCollection<string>();

            messages.Message += delegate(object sender, TextEventArgs e)
            {
                Dispatcher.InvokeIfRequired(() =>
                {
                    if (this.Messages.Count > 10000)
                    {
                        for (int i = 0; i < 50; i++)
                        {
                            this.Messages.RemoveAt(0);
                        }
                    }

                    this.Messages.Add(e.Text);
                });
            };

            displayResponder.ReceivedLine += delegate(object sender, TechnologySolutions.Rfid.AsciiProtocol.AsciiLineEventArgs e)
            {
                Dispatcher.InvokeIfRequired(() =>
                {
                    if (this.Responses.Count > 10000)
                    {
                        for (int i = 0; i < 50; i++)
                        {
                            this.Responses.RemoveAt(0);
                        }
                    }

                    this.Responses.Add(e.Line.FullLine);
                });
            };

            this.ClearMessagesCommand = new DelegateCommand(this.ExecuteClearMessages, DelegateCommand.CanExecuteAlways);
            this.ClearMessagesAndResponsesCommand = new DelegateCommand(this.ExecuteClearMessagesAndResponses, DelegateCommand.CanExecuteAlways);
            this.ClearResponsesCommand = new DelegateCommand(this.ExecuteClearResponses, DelegateCommand.CanExecuteAlways);
            this.ToggleIsProtocolResponseWindowVisibleCommand = new DelegateCommand(
                this.ExecuteToggleIsProtocolResponseWindowVisible,
                DelegateCommand.CanExecuteAlways);
        }

        /// <summary>
        /// Gets the messages to display to the user
        /// </summary>
        public ObservableCollection<string> Messages { get; private set; }

        /// <summary>
        /// Gets the responses received from the reader
        /// </summary>
        public ObservableCollection<string> Responses { get; private set; }

        /// <summary>
        /// Gets the ICommand to clear the messages window
        /// </summary>
        public ICommand ClearMessagesCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand to clear the messages and responses windows
        /// </summary>
        public ICommand ClearMessagesAndResponsesCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand to clear the responses window
        /// </summary>
        public ICommand ClearResponsesCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand to toggle the IsProtocolResponseWindowVisible property / setting
        /// </summary>
        public ICommand ToggleIsProtocolResponseWindowVisibleCommand { get; private set; }

        /// <summary>
        /// Gets or sets a value indicating whether the protocol response window should be visible
        /// </summary>
        public bool IsProtocolResponsePanelVisible
        {
            get
            {
                return this.responseSettings.IsProtocolResponsePanelVisible;
            }

            set
            {
                this.responseSettings.IsProtocolResponsePanelVisible = value;
                this.OnPropertyChanged("IsNotProtocolResponsePanelVisible");
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the protocol response window should not be visible
        /// </summary>
        public bool IsNotProtocolResponsePanelVisible
        {
            get
            {
                return !this.IsProtocolResponsePanelVisible;
            }

            set
            {
                this.IsProtocolResponsePanelVisible = !value;
            }
        }

        /// <summary>
        /// Implementation of the <see cref="ClearMessages"/> ICommand
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteClearMessages(object parameter)
        {
            Dispatcher.InvokeIfRequired(() => { this.Messages.Clear(); });
        }

        /// <summary>
        /// Implementation of the <see cref="ClearResponses"/> ICommand
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteClearResponses(object parameter)
        {
            Dispatcher.InvokeIfRequired(() => { this.Responses.Clear(); });
        }

        /// <summary>
        /// Implementation of the <see cref="ClearMessagesAndResponses"/> ICommand
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteClearMessagesAndResponses(object parameter)
        {
            Dispatcher.InvokeIfRequired(() => { this.Messages.Clear(); this.Responses.Clear(); });
        }

        /// <summary>
        /// Implements the <see cref="ToggleIsProtocolResponseWindowVisisble"/> ICommand
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteToggleIsProtocolResponseWindowVisible(object parameter)
        {
            this.IsProtocolResponsePanelVisible = !this.IsProtocolResponsePanelVisible;
        }        

        /// <summary>
        /// When the setting is changed this is notified through to the view. Use the view model 
        /// PropertyChanged event to ensure it is raised on the correct thread
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ResponseSettings_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            this.OnPropertyChanged(e.PropertyName);
        }
    }
}
