//-----------------------------------------------------------------------
// <copyright file="SettingsEntityBase.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Base class where an entity is stored in the application settings with a common prefix. 
    /// The settings derived for the entity are referenced to the settings raising the appropriate
    /// PropertyChanged notification by removing the prefix
    /// </summary>
    public abstract class SettingsEntityBase
        : PropertyChangedEntityBase
    {
        /// <summary>
        /// Initializes a new instance of the SettingsEntityBase class
        /// </summary>
        /// <param name="prefix">The prefix used for all settings that relate to this class</param>
        /// <remarks>
        /// All the settings in application settings and named with a prefix. This allows the OnPropertyChanged notification
        /// to only be raised from this class for properties relating to this class by capturing PropertyChanged on the settings
        /// </remarks>
        protected SettingsEntityBase(string prefix)
            : this(Properties.Settings.Default, prefix)
        {
        }

        /// <summary>
        /// Initializes a new instance of the SettingsEntityBase class
        /// </summary>
        /// <param name="settings">The settings where the values for this entity are stored</param>
        /// <param name="prefix">The prefix used for all settings that relate to this class</param>
        protected SettingsEntityBase(Properties.Settings settings, string prefix)
        {
            if (settings == null)
            {
                throw new ArgumentNullException("settings");
            }

            if (string.IsNullOrEmpty(prefix))
            {
                throw new ArgumentNullException("prefix");
            }

            this.Settings = settings;
            this.Settings.PropertyChanged += this.Settings_PropertyChanged;
            this.Prefix = prefix;
        }

        /// <summary>
        /// Gets the settings stored for this entity
        /// </summary>
        protected Properties.Settings Settings { get; private set; }

        /// <summary>
        /// Gets the prefx for this settings group
        /// </summary>
        protected string Prefix { get; private set; }

        /// <summary>
        /// When a value is changed in the settings it raises PropertyChanged. All the settings are prefixed with
        /// <see cref="Prefix"/> this enables the PropertyChanged event to be raised from instances of this class
        /// only when properties relating to this class change
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data relating to this event</param>
        private void Settings_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName.StartsWith(this.Prefix))
            {
                // remove the prefix from the property name before sending to listeners
                this.OnPropertyChanged(e.PropertyName.Substring(this.Prefix.Length));
            }
        }
    }
}
