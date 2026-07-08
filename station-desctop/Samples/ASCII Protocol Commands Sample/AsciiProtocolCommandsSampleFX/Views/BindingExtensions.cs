//-----------------------------------------------------------------------
// <copyright file="BindingExtensions.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    /// <summary>
    /// Extension methods to help bind controls
    /// </summary>
    public static class BindingExtensions
    {
        /// <summary>
        /// Binds a CheckBox.Checkstate property with ThreeState enabled to a Nullable&lt;bool&gt;
        /// </summary>
        /// <param name="checkBox">The check box to bind to</param>
        /// <param name="viewModel">The view model with the bool? property</param>
        /// <param name="dataMember">The name of the property</param>
        public static void BindCheckState(this CheckBox checkBox, object viewModel, string dataMember)
        {
            checkBox.ThreeState = true;
            checkBox.DataBindings.Add(
                "CheckState",
                viewModel,
                dataMember,
                true,
                DataSourceUpdateMode.OnPropertyChanged,
                CheckState.Indeterminate);
        }

        /// <summary>
        /// Binds a ComboBox to an property that is an enumeration
        /// </summary>
        /// <param name="comboBox">The ComboBox to bind to</param>
        /// <param name="viewModel">The view model with the Enumeration property</param>
        /// <param name="dataMember">The name of the property to bind to</param>
        /// <param name="dataSource">The ICollection of Enum values for options</param>
        public static void BindEnumeration(this ComboBox comboBox, object viewModel, string dataMember, object dataSource)
        {
            comboBox.DataSource = dataSource;
            comboBox.DataBindings.Add("SelectedItem", viewModel, dataMember);
        }
    }
}
