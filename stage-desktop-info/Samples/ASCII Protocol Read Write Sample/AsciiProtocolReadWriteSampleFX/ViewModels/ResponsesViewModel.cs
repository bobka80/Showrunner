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
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.ViewModels;

    /// <summary>
    /// View model to display responess from the reader
    /// </summary>
    public class ResponsesViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Settings for this view model
        /// </summary>
        private Entities.IResponseSettings settings;

        /// <summary>
        /// Initializes a new instance of the ResponsesViewModel class
        /// </summary>
        public ResponsesViewModel(
            Services.MessageService messageService, 
            TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder displayResponder,
            Entities.IResponseSettings settings)
        {
            if (messageService == null)
            {
                throw new ArgumentNullException("messageService");
            }

            if (displayResponder == null)
            {
                throw new ArgumentNullException("displayResponder");
            }

            if (settings == null)            
            {
                throw new ArgumentNullException("settings");
            }

            this.settings = settings;

            this.Messages = new ObservableCollection<string>();
            this.Responses = new ObservableCollection<string>();

            messageService.Message += delegate(object sender, TextEventArgs e)
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
                Dispatcher.InvokeIfRequired(() => {

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

            this.ClearMessages = new DelegateCommand(this.ExecuteClearMessages, DelegateCommand.CanExecuteAlways);
            this.ClearMessagesAndResponses = new DelegateCommand(this.ExecuteClearMessagesAndResponses, DelegateCommand.CanExecuteAlways);
            this.ClearResponses = new DelegateCommand(this.ExecuteClearResponses, DelegateCommand.CanExecuteAlways);
            this.ToggleIsProtocolResponseWindowVisible = new DelegateCommand(
                this.ExecuteToggleIsProtocolResponseWindowVisible,
                DelegateCommand.CanExecuteAlways);
        }

        public ObservableCollection<string> Messages { get; set; }

        public ObservableCollection<string> Responses { get; set; }

        /// <summary>
        /// Gets the ICommand to clear the messages window
        /// </summary>
        public ICommand ClearMessages { get; private set; }

        /// <summary>
        /// Gets the ICommand to clear the messages and responses windows
        /// </summary>
        public ICommand ClearMessagesAndResponses { get; private set; }

        /// <summary>
        /// Gets the ICommand to clear the responses window
        /// </summary>
        public ICommand ClearResponses { get; private set; }

        /// <summary>
        /// Gets the ICommand to toggle the IsProtocolResponseWindowVisible property / setting
        /// </summary>
        public ICommand ToggleIsProtocolResponseWindowVisible { get; private set; }

        /// <summary>
        /// Gets or sets a value indicating whether the protocol response window should be visible
        /// </summary>
        public bool IsProtocolResponseWindowVisible
        {
            get
            {
                return this.settings.IsProtocolResponsePanelVisible;
            }

            set            
            {
                if (this.settings.IsProtocolResponsePanelVisible != value)
                {
                    this.settings.IsProtocolResponsePanelVisible = value;
                    this.OnPropertyChanged("IsProtocolResponseWindowVisible");
                    this.OnPropertyChanged("IsNotProtocolResponseWindowVisible");
                }
            }
        }

        /// <summary>
        /// Gets or sets the inverse of <see cref="IsProtocolResponseWindowVisible"/>
        /// </summary>
        public bool IsNotProtocolResponseWindowVisible
        {
            get
            {
                return !this.IsProtocolResponseWindowVisible;
            }

            set
            {
                this.IsProtocolResponseWindowVisible = !value;
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
            Dispatcher.InvokeIfRequired(() =>
            {
                this.Messages.Clear();
                this.Responses.Clear();
            });
        }

        /// <summary>
        /// Implements the <see cref="ToggleIsProtocolResponseWindowVisisble"/> ICommand
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteToggleIsProtocolResponseWindowVisible(object parameter)
        {
            this.IsProtocolResponseWindowVisible = !this.IsProtocolResponseWindowVisible;
        }      
    }
}
