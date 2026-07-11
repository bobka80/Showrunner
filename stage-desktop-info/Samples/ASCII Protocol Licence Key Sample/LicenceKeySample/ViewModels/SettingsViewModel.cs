//-----------------------------------------------------------------------
// <copyright file="SettingsViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Text;

    using Entities;
    using TechnologySolutions.ModelViewViewModel.ViewModels;

    /// <summary>
    /// View model to edit the settings
    /// </summary>
    public class SettingsViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Local cahche of settings
        /// </summary>
        private ISettings settings;

        /// <summary>
        /// Backing field for CompanyName
        /// </summary>
        private string companyName;

        /// <summary>
        /// Backing field for Secret
        /// </summary>
        private string secret;

        /// <summary>
        /// Backing field for CanExecuteApplyChanges
        /// </summary>
        private bool canExecuteApplyChanges;

        /// <summary>
        /// Initializes a new instance of the SettingsViewModel class
        /// </summary>
        /// <param name="settings">The settings to edit</param>
        public SettingsViewModel(ISettings settings)
        {
            if (settings == null)
            {
                throw new ArgumentNullException("settings");
            }

            this.settings = settings;
            this.settings.PropertyChanged += this.Settings_PropertyChanged;
            this.CompanyName = this.settings.CompanyName;
            this.Secret = this.settings.Secret;
        }

        /// <summary>
        /// Gets a value indicating whether ExecuteApplyChanges can be performed
        /// </summary>
        public bool CanExecuteApplyChanges
        {
            get
            {
                return this.canExecuteApplyChanges;
            }

            private set
            {
                this.SetProperty(ref this.canExecuteApplyChanges, value, "CanExecuteApplyChanges");
            }
        }

        /// <summary>
        /// Gets or sets the company name
        /// </summary>
        public string CompanyName 
        {
            get
            {
                return this.companyName;
            }
            
            set
            {
                if (this.SetProperty(ref this.companyName, value, "CompanyName"))
                {
                    this.EvaluateCanExecuteApplyChanges();
                }
            } 
        }

        /// <summary>
        /// Gets or sets the secret
        /// </summary>
        public string Secret 
        { 
            get
            {
                return this.secret;
            }

            set
            {
                if (this.SetProperty(ref this.secret, value, "Secret"))
                {
                    this.EvaluateCanExecuteApplyChanges();
                }
            }
        }

        /// <summary>
        /// Updates the settings with the new values
        /// </summary>
        public void ExecuteApplyChanges()
        {
            this.settings.CompanyName = this.CompanyName;
            this.settings.Secret = this.Secret;
        }

        /// <summary>
        /// Updates the CanExecuteApplyChanges based on the values of the settings
        /// </summary>
        private void EvaluateCanExecuteApplyChanges()
        {
            this.CanExecuteApplyChanges =
                this.CompanyName != this.settings.CompanyName ||
                this.Secret != this.settings.Secret;
        }

        /// <summary>
        /// Updates the local settings to match the stored settings
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void Settings_PropertyChanged(object sender, System.ComponentModel.PropertyChangedEventArgs e)
        {
            if ("CompanyName".Equals(e.PropertyName))
            {
                this.CompanyName = this.settings.CompanyName;
            }
            else if ("Secret".Equals(e.PropertyName))
            {
                this.Secret = this.settings.Secret;
            }
        }        
    }
}
